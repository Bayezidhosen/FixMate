import express, { type Request, type Response } from 'express';
import Stripe from 'stripe';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  SERVICE_CATEGORIES,
  SERVICE_MODES,
  type BookingStatus,
  type UserRole,
  type ServiceCategory,
  type ServiceMode,
} from '../shared/types.ts';
import {
  registerWithEmail,
  loginWithEmail,
  logoutSession,
  resolveAuthenticatedUser,
  setAuthCookies,
  signJwtToken,
} from './auth.ts';
import {
  verifyToken,
  verifyCustomer,
  verifyTechnician,
  verifyAdmin,
} from './middleware.ts';
import {
  queryPublicServices,
  findServiceById,
  listTechnicianServices,
  createServiceItem,
  updateServiceItem,
  deleteServiceItem,
  findActiveBookingForCustomerService,
  createBookingRecord,
  findBookingById,
  listCustomerBookings,
  listTechnicianBookings,
  updateBookingRecord,
  listCustomerPayments,
  listAllUsers,
  updateUserRoleById,
  listAllServicesAdmin,
  listAllBookingsAdmin,
  listAllPaymentsAdmin,
  updateUserProfile,
  findUserByEmail,
  recordVerifiedPaymentIdempotent,
  findPaymentByBookingId,
} from './db.ts';

const UPLOADS_DIR = path.resolve(process.cwd(), '.fixmate-uploads');

function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key);
}

// Track local test checkout sessions when STRIPE_SECRET_KEY is not configured
const localTestSessions = new Map<
  string,
  {
    sessionId: string;
    bookingId: string;
    customerEmail: string;
    amount: number;
    serviceTitle: string;
    technicianName: string;
    createdAt: number;
  }
>();

function getAppOrigin(req: Request): string {
  if (process.env.APP_URL?.trim()) {
    return process.env.APP_URL.trim().replace(/\/$/, '');
  }
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  return `${proto}://${host}`;
}

export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const sig = req.headers['stripe-signature'];

  if (!stripe || !webhookSecret || typeof sig !== 'string') {
    res.status(400).json({ error: 'Stripe webhook configuration or signature missing.' });
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    res.status(400).json({ error: `Webhook signature verification failed: ${err?.message || 'Invalid'}` });
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;
    if (bookingId && session.payment_status === 'paid') {
      try {
        const booking = await findBookingById(bookingId);
        if (booking) {
          await recordVerifiedPaymentIdempotent({
            bookingId,
            stripeSessionId: session.id,
            transactionId:
              typeof session.payment_intent === 'string'
                ? session.payment_intent
                : session.id,
            amount: booking.finalAmount,
            currency: (session.currency || 'usd').toUpperCase(),
          });
        }
      } catch (err) {
        console.error('[FixMate Webhook] Payment persistence error:', err);
        res.status(500).json({ error: 'Webhook processing failed.' });
        return;
      }
    }
  }

  res.json({ received: true });
}

export function createApiRouter(): express.Router {
  const router = express.Router();

  // ---------------- HEALTH ----------------
  router.get('/health', (_req, res) => {
    res.json({
      ok: true,
      stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
      imgbbConfigured: Boolean(process.env.IMGBB_API_KEY?.trim()),
      mongoConfigured: Boolean(process.env.MONGODB_URI?.trim()),
    });
  });

  // ---------------- AUTHENTICATION ----------------
  router.post('/auth/sign-up', async (req, res) => {
    try {
      const { name, email, password, role, phone, area } = req.body || {};
      const { user, jwtToken, sessionToken } = await registerWithEmail({
        name,
        email,
        password,
        role,
        phone,
        area,
      });
      setAuthCookies(res, jwtToken, sessionToken);
      res.status(201).json({ user, token: jwtToken });
    } catch (err: any) {
      if (err?.message === 'EMAIL_EXISTS') {
        res.status(400).json({ error: 'An account with this email already exists.' });
        return;
      }
      res.status(400).json({ error: err?.message || 'Registration failed.' });
    }
  });

  router.post('/auth/sign-in', async (req, res) => {
    try {
      const { email, password } = req.body || {};
      const { user, jwtToken, sessionToken } = await loginWithEmail({ email, password });
      setAuthCookies(res, jwtToken, sessionToken);
      res.json({ user, token: jwtToken });
    } catch (err: any) {
      res.status(401).json({ error: err?.message || 'Invalid credentials.' });
    }
  });

  router.post('/auth/sign-out', async (req, res) => {
    await logoutSession(req, res);
    res.json({ ok: true });
  });

  router.get('/auth/session', async (req, res) => {
    const user = await resolveAuthenticatedUser(req, res);
    if (!user) {
      res.json({ user: null });
      return;
    }
    res.json({ user });
  });

  router.post('/auth/token', verifyToken, (req, res) => {
    const user = req.authUser!;
    const jwtToken = signJwtToken(user);
    res.json({ token: jwtToken, user });
  });

  // ---------------- PROFILE & UPLOAD ----------------
  router.patch('/users/profile', verifyToken, async (req, res) => {
    try {
      const authUser = req.authUser!;
      const { name, phone, area, bio, image } = req.body || {};

      if (typeof name === 'string' && name.trim().length < 2) {
        res.status(400).json({ error: 'Name must be at least 2 characters.' });
        return;
      }

      const updated = await updateUserProfile(authUser.email, { name, phone, area, bio, image });
      if (!updated) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      const { passwordHash: _pw, ...safeUser } = updated;
      const freshJwt = signJwtToken(safeUser);
      res.cookie('fixmate_token', freshJwt, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 2 * 60 * 60 * 1000,
      });

      res.json({ user: safeUser });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Failed to update profile.' });
    }
  });

  router.post('/upload', verifyToken, async (req, res) => {
    try {
      const { imageBase64, fileName } = req.body || {};
      if (!imageBase64 || typeof imageBase64 !== 'string') {
        res.status(400).json({ error: 'Image payload is required.' });
        return;
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const imgbbKey = process.env.IMGBB_API_KEY?.trim();

      if (imgbbKey) {
        const form = new URLSearchParams();
        form.append('key', imgbbKey);
        form.append('image', cleanBase64);
        if (fileName) form.append('name', String(fileName).slice(0, 60));

        const imgbbRes = await fetch('https://api.imgbb.com/1/upload', {
          method: 'POST',
          body: form,
        });
        const imgbbData: any = await imgbbRes.json();
        if (!imgbbRes.ok || !imgbbData?.data?.url) {
          throw new Error(imgbbData?.error?.message || 'ImgBB upload failed.');
        }
        res.json({ url: imgbbData.data.url, provider: 'imgbb' });
        return;
      }

      // Local upload fallback when IMGBB_API_KEY is not configured
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }
      const match = imageBase64.match(/^data:image\/(\w+);base64,/);
      const ext = match ? (match[1] === 'jpeg' ? 'jpg' : match[1]) : 'png';
      const safeFile = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
      fs.writeFileSync(path.join(UPLOADS_DIR, safeFile), Buffer.from(cleanBase64, 'base64'));
      res.json({ url: `/api/uploads/${safeFile}`, provider: 'local' });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Image upload failed.' });
    }
  });

  router.get('/uploads/:filename', (req, res) => {
    const safeName = path.basename(req.params.filename);
    const fullPath = path.join(UPLOADS_DIR, safeName);
    if (!fs.existsSync(fullPath)) {
      res.status(404).json({ error: 'Image not found.' });
      return;
    }
    res.sendFile(fullPath);
  });

  // ---------------- PUBLIC & TECHNICIAN SERVICES ----------------
  router.get('/services', async (req, res) => {
    try {
      const search = typeof req.query.search === 'string' ? req.query.search : '';
      const category = typeof req.query.category === 'string' ? req.query.category : 'All';
      const mode = typeof req.query.mode === 'string' ? req.query.mode : 'All';
      const sort = typeof req.query.sort === 'string' ? req.query.sort : 'newest';
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 9;

      const result = await queryPublicServices({ search, category, mode, sort, page, limit });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to fetch services.' });
    }
  });

  router.get('/services/technician', verifyToken, verifyTechnician, async (req, res) => {
    const services = await listTechnicianServices(req.authUser!.email);
    res.json({ services });
  });

  router.get('/services/:id', async (req, res) => {
    const service = await findServiceById(req.params.id);
    if (!service) {
      res.status(404).json({ error: 'Service not found.' });
      return;
    }

    if (service.approvalStatus !== 'approved' || !service.isAvailable) {
      const user = await resolveAuthenticatedUser(req);
      const isOwner = user && user.email === service.technicianEmail;
      const isAdmin = user && user.role === 'admin';
      if (!isOwner && !isAdmin) {
        res.status(404).json({ error: 'Service not available.' });
        return;
      }
    }

    const technician = await findUserByEmail(service.technicianEmail);
    res.json({
      service,
      technician: technician
        ? {
            name: technician.name,
            email: technician.email,
            area: technician.area,
            bio: technician.bio,
            image: technician.image,
          }
        : null,
    });
  });

  router.post('/services', verifyToken, verifyTechnician, async (req, res) => {
    try {
      const {
        title,
        category,
        description,
        basePrice,
        estimatedDuration,
        serviceMode,
        serviceArea,
        image,
      } = req.body || {};

      if (!title || String(title).trim().length < 4) {
        res.status(400).json({ error: 'Service title must be at least 4 characters.' });
        return;
      }
      if (!SERVICE_CATEGORIES.includes(category as ServiceCategory)) {
        res.status(400).json({ error: 'Invalid service category.' });
        return;
      }
      if (!SERVICE_MODES.includes(serviceMode as ServiceMode)) {
        res.status(400).json({ error: 'Invalid service mode.' });
        return;
      }
      if (!description || String(description).trim().length < 20) {
        res.status(400).json({ error: 'Description must be at least 20 characters.' });
        return;
      }
      const priceNum = Number(basePrice);
      if (!Number.isFinite(priceNum) || priceNum <= 0) {
        res.status(400).json({ error: 'Base price must be greater than zero.' });
        return;
      }
      if (!estimatedDuration || !serviceArea) {
        res.status(400).json({ error: 'Estimated duration and service area are required.' });
        return;
      }

      const created = await createServiceItem({
        title: String(title),
        category: category as ServiceCategory,
        description: String(description),
        image: image ? String(image) : '/src/assets/images/service_smartphone_1795006392558.jpg',
        basePrice: priceNum,
        estimatedDuration: String(estimatedDuration),
        serviceMode: serviceMode as ServiceMode,
        serviceArea: String(serviceArea),
        technicianName: req.authUser!.name,
        technicianEmail: req.authUser!.email,
      });

      res.status(201).json({ service: created });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Failed to create service.' });
    }
  });

  router.patch('/services/:id', verifyToken, verifyTechnician, async (req, res) => {
    const existing = await findServiceById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Service not found.' });
      return;
    }
    if (existing.technicianEmail !== req.authUser!.email) {
      res.status(403).json({ error: 'Forbidden: You do not own this service.' });
      return;
    }

    const body = req.body || {};
    const updates: Record<string, any> = {};

    // Check if toggling availability only
    const detailKeys = [
      'title',
      'category',
      'description',
      'basePrice',
      'estimatedDuration',
      'serviceMode',
      'serviceArea',
      'image',
    ];
    let editedDetails = false;

    if (typeof body.isAvailable === 'boolean') {
      updates.isAvailable = body.isAvailable;
    }

    for (const key of detailKeys) {
      if (body[key] !== undefined) {
        editedDetails = true;
        updates[key] = body[key];
      }
    }

    if (editedDetails) {
      if (updates.basePrice !== undefined) {
        const priceNum = Number(updates.basePrice);
        if (!Number.isFinite(priceNum) || priceNum <= 0) {
          res.status(400).json({ error: 'Base price must be greater than zero.' });
          return;
        }
        updates.basePrice = priceNum;
      }
      if (updates.category !== undefined && !SERVICE_CATEGORIES.includes(updates.category)) {
        res.status(400).json({ error: 'Invalid service category.' });
        return;
      }
      if (updates.serviceMode !== undefined && !SERVICE_MODES.includes(updates.serviceMode)) {
        res.status(400).json({ error: 'Invalid service mode.' });
        return;
      }
      // Required rule: after editing, approvalStatus must become pending again
      updates.approvalStatus = 'pending';
    }

    const updated = await updateServiceItem(existing._id, updates);
    res.json({ service: updated });
  });

  router.delete('/services/:id', verifyToken, verifyTechnician, async (req, res) => {
    const existing = await findServiceById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Service not found.' });
      return;
    }
    if (existing.technicianEmail !== req.authUser!.email) {
      res.status(403).json({ error: 'Forbidden: You do not own this service.' });
      return;
    }
    await deleteServiceItem(existing._id);
    res.json({ ok: true });
  });

  // ---------------- CUSTOMER BOOKINGS ----------------
  router.post('/bookings', verifyToken, verifyCustomer, async (req, res) => {
    try {
      const customer = req.authUser!;
      const { serviceId, phone, address, preferredDate, problemDescription } = req.body || {};

      if (!serviceId) {
        res.status(400).json({ error: 'Service ID is required.' });
        return;
      }
      if (!phone || !/^[+\d\s()-]{7,20}$/.test(String(phone).trim())) {
        res.status(400).json({ error: 'Please provide a valid phone number.' });
        return;
      }
      if (!address || String(address).trim().length < 5) {
        res.status(400).json({ error: 'Please provide a valid service address.' });
        return;
      }
      if (!preferredDate) {
        res.status(400).json({ error: 'Preferred date is required.' });
        return;
      }
      const todayStr = new Date().toISOString().slice(0, 10);
      if (String(preferredDate).slice(0, 10) < todayStr) {
        res.status(400).json({ error: 'Preferred date must be today or a future date.' });
        return;
      }
      if (!problemDescription || String(problemDescription).trim().length < 20) {
        res.status(400).json({ error: 'Problem description must be at least 20 characters.' });
        return;
      }

      const service = await findServiceById(String(serviceId));
      if (!service || service.approvalStatus !== 'approved' || !service.isAvailable) {
        res.status(404).json({ error: 'Service not found or currently unavailable.' });
        return;
      }

      const duplicate = await findActiveBookingForCustomerService(customer.email, service._id);
      if (duplicate) {
        res.status(400).json({
          error: 'You already have an active repair request for this service.',
        });
        return;
      }

      const booking = await createBookingRecord({
        serviceId: service._id,
        serviceTitle: service.title,
        serviceImage: service.image,
        category: service.category,
        basePrice: service.basePrice,
        technicianName: service.technicianName,
        technicianEmail: service.technicianEmail,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: String(phone).trim(),
        address: String(address).trim(),
        preferredDate: String(preferredDate).slice(0, 10),
        problemDescription: String(problemDescription).trim(),
        status: 'requested',
        finalAmount: service.basePrice,
        paymentStatus: 'unpaid',
      });

      res.status(201).json({ booking });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Failed to submit repair request.' });
    }
  });

  router.get('/bookings/my', verifyToken, verifyCustomer, async (req, res) => {
    const bookings = await listCustomerBookings(req.authUser!.email);
    res.json({ bookings });
  });

  router.patch('/bookings/:id/cancel', verifyToken, verifyCustomer, async (req, res) => {
    const booking = await findBookingById(req.params.id);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }
    if (booking.customerEmail !== req.authUser!.email) {
      res.status(403).json({ error: 'Forbidden: You can only cancel your own bookings.' });
      return;
    }
    if (booking.status !== 'requested') {
      res.status(400).json({
        error: `Cannot cancel booking when status is '${booking.status}'. Only requested jobs can be cancelled.`,
      });
      return;
    }

    const updated = await updateBookingRecord(booking._id, { status: 'cancelled' });
    res.json({ booking: updated });
  });

  // ---------------- TECHNICIAN BOOKINGS ----------------
  router.get('/bookings/technician', verifyToken, verifyTechnician, async (req, res) => {
    const statusFilter = typeof req.query.status === 'string' ? req.query.status : 'all';
    const bookings = await listTechnicianBookings(req.authUser!.email, statusFilter);
    res.json({ bookings });
  });

  router.patch('/bookings/:id/status', verifyToken, verifyTechnician, async (req, res) => {
    const booking = await findBookingById(req.params.id);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }
    if (booking.technicianEmail !== req.authUser!.email) {
      res.status(403).json({ error: 'Forbidden: You do not own this booking.' });
      return;
    }

    const nextStatus = req.body?.status as BookingStatus;
    const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
      requested: ['accepted', 'rejected'],
      accepted: ['in-progress'],
      'in-progress': ['completed'],
      completed: [],
      rejected: [],
      cancelled: [],
    };

    if (!allowedTransitions[booking.status]?.includes(nextStatus)) {
      res.status(400).json({
        error: `Invalid status transition from '${booking.status}' to '${nextStatus}'.`,
      });
      return;
    }

    const updates: Partial<typeof booking> = { status: nextStatus };

    if (nextStatus === 'completed') {
      const finalAmt = Number(req.body?.finalAmount);
      if (!Number.isFinite(finalAmt) || finalAmt <= 0) {
        res.status(400).json({ error: 'Final amount must be a number greater than zero.' });
        return;
      }
      updates.finalAmount = Math.round(finalAmt * 100) / 100;
    }

    const updated = await updateBookingRecord(booking._id, updates);
    res.json({ booking: updated });
  });

  // ---------------- STRIPE PAYMENTS ----------------
  router.get('/payments/my', verifyToken, verifyCustomer, async (req, res) => {
    const payments = await listCustomerPayments(req.authUser!.email);
    res.json({ payments });
  });

  router.post('/payments/create-checkout-session', verifyToken, verifyCustomer, async (req, res) => {
    try {
      const customer = req.authUser!;
      const { bookingId } = req.body || {};
      if (!bookingId) {
        res.status(400).json({ error: 'Booking ID is required.' });
        return;
      }

      const booking = await findBookingById(String(bookingId));
      if (!booking) {
        res.status(404).json({ error: 'Booking not found.' });
        return;
      }
      if (booking.customerEmail !== customer.email) {
        res.status(403).json({ error: 'Forbidden: You do not own this booking.' });
        return;
      }
      if (booking.status !== 'completed') {
        res.status(400).json({ error: 'Only completed repairs can be paid.' });
        return;
      }
      if (booking.paymentStatus === 'paid') {
        res.status(400).json({ error: 'This booking has already been paid.' });
        return;
      }

      const existingPay = await findPaymentByBookingId(booking._id);
      if (existingPay) {
        res.status(400).json({ error: 'A payment record already exists for this booking.' });
        return;
      }

      // Retrieve authoritative finalAmount strictly from DB
      const authoritativeAmount = booking.finalAmount;
      if (!Number.isFinite(authoritativeAmount) || authoritativeAmount <= 0) {
        res.status(400).json({ error: 'Invalid booking payment amount.' });
        return;
      }

      const origin = getAppOrigin(req);
      const stripe = getStripeClient();

      if (stripe) {
        const session = await stripe.checkout.sessions.create({
          mode: 'payment',
          customer_email: customer.email,
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: booking.serviceTitle,
                  description: `FixMate Repair by ${booking.technicianName} (${booking.category})`,
                },
                unit_amount: Math.round(authoritativeAmount * 100),
              },
              quantity: 1,
            },
          ],
          metadata: {
            bookingId: booking._id,
            customerEmail: customer.email,
          },
          success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/payment/cancel?booking_id=${encodeURIComponent(booking._id)}`,
        });

        res.json({ url: session.url, sessionId: session.id, mode: 'stripe' });
        return;
      }

      // Local Stripe Test Mode Checkout route when STRIPE_SECRET_KEY is not yet configured
      const sessionId = `cs_test_local_${crypto.randomBytes(10).toString('hex')}`;
      localTestSessions.set(sessionId, {
        sessionId,
        bookingId: booking._id,
        customerEmail: customer.email,
        amount: authoritativeAmount,
        serviceTitle: booking.serviceTitle,
        technicianName: booking.technicianName,
        createdAt: Date.now(),
      });

      res.json({
        url: `/stripe-test-checkout?session_id=${encodeURIComponent(sessionId)}`,
        sessionId,
        mode: 'local_test',
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to initiate Stripe checkout.' });
    }
  });

  router.get('/payments/local-session/:sessionId', verifyToken, verifyCustomer, (req, res) => {
    const sess = localTestSessions.get(req.params.sessionId);
    if (!sess) {
      res.status(404).json({ error: 'Test checkout session not found or expired.' });
      return;
    }
    if (sess.customerEmail !== req.authUser!.email) {
      res.status(403).json({ error: 'Forbidden.' });
      return;
    }
    res.json({ session: sess });
  });

  router.post('/payments/verify-session', verifyToken, verifyCustomer, async (req, res) => {
    try {
      const customer = req.authUser!;
      const { sessionId } = req.body || {};
      if (!sessionId || typeof sessionId !== 'string') {
        res.status(400).json({ error: 'Stripe session ID is required.' });
        return;
      }

      const stripe = getStripeClient();

      if (stripe && !sessionId.startsWith('cs_test_local_')) {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (!session || session.payment_status !== 'paid') {
          res.status(400).json({ error: 'Payment has not been completed in Stripe.' });
          return;
        }
        const bookingId = session.metadata?.bookingId;
        const metaEmail = session.metadata?.customerEmail?.toLowerCase();
        if (!bookingId || metaEmail !== customer.email) {
          res.status(403).json({ error: 'Forbidden: Session does not belong to current customer.' });
          return;
        }

        const booking = await findBookingById(bookingId);
        if (!booking) {
          res.status(404).json({ error: 'Booking not found.' });
          return;
        }

        const result = await recordVerifiedPaymentIdempotent({
          bookingId: booking._id,
          stripeSessionId: session.id,
          transactionId:
            typeof session.payment_intent === 'string' ? session.payment_intent : session.id,
          amount: booking.finalAmount,
          currency: (session.currency || 'usd').toUpperCase(),
        });

        res.json(result);
        return;
      }

      // Local test session verification
      const localSess = localTestSessions.get(sessionId);
      if (!localSess) {
        // Check if already persisted idempotently
        const allMyPayments = await listCustomerPayments(customer.email);
        const existing = allMyPayments.find((p) => p.stripeSessionId === sessionId);
        if (existing) {
          const bk = await findBookingById(existing.bookingId);
          res.json({ payment: existing, booking: bk });
          return;
        }
        res.status(404).json({ error: 'Payment session not found.' });
        return;
      }

      if (localSess.customerEmail !== customer.email) {
        res.status(403).json({ error: 'Forbidden.' });
        return;
      }

      const result = await recordVerifiedPaymentIdempotent({
        bookingId: localSess.bookingId,
        stripeSessionId: localSess.sessionId,
        transactionId: `pi_test_${crypto.randomBytes(8).toString('hex')}`,
        amount: localSess.amount,
        currency: 'USD',
      });

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Payment verification failed.' });
    }
  });

  // ---------------- ADMIN ----------------
  router.get('/admin/stats', verifyToken, verifyAdmin, async (_req, res) => {
    const [users, services, bookings, payments] = await Promise.all([
      listAllUsers(),
      listAllServicesAdmin(),
      listAllBookingsAdmin(),
      listAllPaymentsAdmin(),
    ]);

    const totalUsers = users.length;
    const totalTechnicians = users.filter((u) => u.role === 'technician').length;
    const pendingServices = services.filter((s) => s.approvalStatus === 'pending').length;
    const totalBookings = bookings.length;
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    // Bookings by category chart data
    const categoryCounts = new Map<string, { category: string; bookings: number; revenue: number }>();
    for (const cat of SERVICE_CATEGORIES) {
      categoryCounts.set(cat, { category: cat, bookings: 0, revenue: 0 });
    }
    for (const b of bookings) {
      const entry = categoryCounts.get(b.category) || { category: b.category, bookings: 0, revenue: 0 };
      entry.bookings += 1;
      if (b.paymentStatus === 'paid') entry.revenue += b.finalAmount;
      categoryCounts.set(b.category, entry);
    }

    // Status distribution for chart
    const statusMap = new Map<string, number>();
    for (const b of bookings) {
      statusMap.set(b.status, (statusMap.get(b.status) || 0) + 1);
    }

    res.json({
      stats: {
        totalUsers,
        totalTechnicians,
        pendingServices,
        totalBookings,
        totalRevenue,
      },
      categoryChart: Array.from(categoryCounts.values()),
      statusChart: Array.from(statusMap.entries()).map(([status, count]) => ({ status, count })),
    });
  });

  router.get('/admin/users', verifyToken, verifyAdmin, async (_req, res) => {
    const users = await listAllUsers();
    res.json({ users });
  });

  router.patch('/admin/users/:id/role', verifyToken, verifyAdmin, async (req, res) => {
    const targetId = req.params.id;
    const nextRole = req.body?.role as UserRole;

    if (!['customer', 'technician', 'admin'].includes(nextRole)) {
      res.status(400).json({ error: 'Invalid role specified.' });
      return;
    }

    if (req.authUser!._id === targetId) {
      res.status(400).json({ error: 'Admins cannot change their own role.' });
      return;
    }

    const updated = await updateUserRoleById(targetId, nextRole);
    if (!updated) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    res.json({ user: updated });
  });

  router.get('/admin/services', verifyToken, verifyAdmin, async (_req, res) => {
    const services = await listAllServicesAdmin();
    res.json({ services });
  });

  router.patch('/admin/services/:id/approval', verifyToken, verifyAdmin, async (req, res) => {
    const status = req.body?.approvalStatus;
    if (status !== 'approved' && status !== 'rejected') {
      res.status(400).json({ error: "Approval status must be 'approved' or 'rejected'." });
      return;
    }
    const updated = await updateServiceItem(req.params.id, { approvalStatus: status });
    if (!updated) {
      res.status(404).json({ error: 'Service not found.' });
      return;
    }
    res.json({ service: updated });
  });

  router.get('/admin/bookings', verifyToken, verifyAdmin, async (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : 'all';
    const bookings = await listAllBookingsAdmin(status);
    res.json({ bookings });
  });

  router.get('/admin/payments', verifyToken, verifyAdmin, async (_req, res) => {
    const payments = await listAllPaymentsAdmin();
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    res.json({ payments, totalRevenue });
  });

  return router;
}
