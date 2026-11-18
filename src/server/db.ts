import { MongoClient, Db, ObjectId, ClientSession } from 'mongodb';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  UserProfile,
  ServiceItem,
  BookingItem,
  PaymentItem,
  ServiceCategory,
  ServiceMode,
  ApprovalStatus,
  BookingStatus,
  PaymentStatus,
  UserRole,
} from '../shared/types.ts';

export interface StoredUser extends UserProfile {
  passwordHash?: string;
}

export interface SessionRecord {
  _id: string;
  token: string;
  userId: string;
  email: string;
  expiresAt: string;
  createdAt: string;
}

interface LocalStoreData {
  users: StoredUser[];
  services: ServiceItem[];
  bookings: BookingItem[];
  payments: PaymentItem[];
  sessions: SessionRecord[];
}

const LOCAL_DB_PATH = path.resolve(process.cwd(), '.fixmate-local-db.json');

let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;
let useMongo = false;

let localCache: LocalStoreData | null = null;

function generateId(): string {
  return new ObjectId().toHexString();
}

function loadLocalStore(): LocalStoreData {
  if (localCache) return localCache;
  if (fs.existsSync(LOCAL_DB_PATH)) {
    try {
      const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
      localCache = JSON.parse(raw) as LocalStoreData;
      return localCache;
    } catch {
      // fall through to initialize clean store
    }
  }
  localCache = {
    users: [],
    services: [],
    bookings: [],
    payments: [],
    sessions: [],
  };
  saveLocalStore();
  return localCache;
}

function saveLocalStore(): void {
  if (!localCache) return;
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(localCache, null, 2), 'utf-8');
}

export function isMongoConnected(): boolean {
  return useMongo && mongoDb !== null;
}

export function getMongoDb(): Db | null {
  return mongoDb;
}

export function getMongoClient(): MongoClient | null {
  return mongoClient;
}

function normalizeMongoUri(raw: string): string {
  const unquoted = raw.trim().replace(/^['"]|['"]$/g, '');
  const schemeMatch = unquoted.match(/^(mongodb(?:\+srv)?:\/\/)(.+)$/);
  if (!schemeMatch) return unquoted;

  const [, scheme, rest] = schemeMatch;
  // Split at the last '@' before the host/query so '@' inside a password is handled safely
  const pathStart = rest.indexOf('/');
  const authority = pathStart === -1 ? rest : rest.slice(0, pathStart);
  const suffix = pathStart === -1 ? '' : rest.slice(pathStart);

  const lastAt = authority.lastIndexOf('@');
  if (lastAt === -1) return unquoted;

  const userInfo = authority.slice(0, lastAt);
  const host = authority.slice(lastAt + 1);
  const firstColon = userInfo.indexOf(':');
  if (firstColon === -1) return unquoted;

  const rawUser = userInfo.slice(0, firstColon);
  const rawPass = userInfo.slice(firstColon + 1);

  const safeEncode = (val: string) => {
    try {
      // Only encode if not already percent-encoded
      return decodeURIComponent(val) === val ? encodeURIComponent(val) : val;
    } catch {
      return encodeURIComponent(val);
    }
  };

  return `${scheme}${safeEncode(rawUser)}:${safeEncode(rawPass)}@${host}${suffix}`;
}

export async function initDatabase(): Promise<void> {
  const rawUri = process.env.MONGODB_URI?.trim();
  const dbName = process.env.MONGODB_DB_NAME?.trim() || 'fixmate';

  if (rawUri) {
    const uri = normalizeMongoUri(rawUri);
    try {
      mongoClient = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
      await mongoClient.connect();
      mongoDb = mongoClient.db(dbName);
      useMongo = true;

      // Ensure exact 4 application collections and required unique indexes
      await mongoDb.collection('users').createIndex({ email: 1 }, { unique: true });
      await mongoDb.collection('services').createIndex({ approvalStatus: 1, isAvailable: 1, createdAt: -1 });
      await mongoDb.collection('services').createIndex({ category: 1 });
      await mongoDb.collection('services').createIndex({ technicianEmail: 1 });
      await mongoDb.collection('bookings').createIndex({ customerEmail: 1, createdAt: -1 });
      await mongoDb.collection('bookings').createIndex({ technicianEmail: 1, createdAt: -1 });
      await mongoDb.collection('bookings').createIndex({ serviceId: 1, customerEmail: 1, status: 1 });
      await mongoDb.collection('payments').createIndex({ bookingId: 1 }, { unique: true });
      await mongoDb.collection('payments').createIndex({ stripeSessionId: 1 }, { unique: true });
      await mongoDb.collection('sessions').createIndex({ token: 1 }, { unique: true });

      console.log(`[FixMate DB] Connected to MongoDB (${dbName})`);
    } catch (err: any) {
      if (mongoClient) {
        await mongoClient.close().catch(() => {});
      }
      mongoClient = null;
      mongoDb = null;
      useMongo = false;
      const reason = err?.codeName || err?.message || 'Connection failed';
      console.warn(
        `[FixMate DB] MongoDB unavailable (${reason}). Using local persistent store (.fixmate-local-db.json).`
      );
      loadLocalStore();
    }
  } else {
    console.log('[FixMate DB] MONGODB_URI not set — using local persistent store (.fixmate-local-db.json)');
    useMongo = false;
    loadLocalStore();
  }

  await seedInitialData();
}

function serializeDoc<T extends { _id: any }>(doc: T): Omit<T, '_id'> & { _id: string } {
  return {
    ...doc,
    _id: typeof doc._id === 'string' ? doc._id : doc._id.toString(),
  };
}

function toObjectIdOrString(id: string): ObjectId | string {
  return ObjectId.isValid(id) ? new ObjectId(id) : id;
}

// ---------------- USERS ----------------

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const normalized = email.trim().toLowerCase();
  if (useMongo && mongoDb) {
    const doc = await mongoDb.collection('users').findOne({ email: normalized });
    return doc ? (serializeDoc(doc as any) as StoredUser) : null;
  }
  const store = loadLocalStore();
  return store.users.find((u) => u.email === normalized) || null;
}

export async function findUserById(id: string): Promise<StoredUser | null> {
  if (useMongo && mongoDb) {
    const query = ObjectId.isValid(id) ? { $or: [{ _id: new ObjectId(id) }, { _id: id as any }] } : { _id: id as any };
    const doc = await mongoDb.collection('users').findOne(query);
    return doc ? (serializeDoc(doc as any) as StoredUser) : null;
  }
  const store = loadLocalStore();
  return store.users.find((u) => u._id === id) || null;
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  phone?: string;
  area?: string;
  bio?: string;
  image?: string;
}): Promise<StoredUser> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const now = new Date().toISOString();
  const newUser: StoredUser = {
    _id: generateId(),
    name: input.name.trim(),
    email: normalizedEmail,
    image: input.image || '',
    role: input.role,
    phone: input.phone || '',
    area: input.area || '',
    bio: input.bio || '',
    passwordHash: input.passwordHash,
    createdAt: now,
  };

  if (useMongo && mongoDb) {
    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      throw new Error('EMAIL_EXISTS');
    }
    await mongoDb.collection('users').insertOne({
      ...newUser,
      _id: new ObjectId(newUser._id),
    } as any);
    return newUser;
  }

  const store = loadLocalStore();
  if (store.users.some((u) => u.email === normalizedEmail)) {
    throw new Error('EMAIL_EXISTS');
  }
  store.users.push(newUser);
  saveLocalStore();
  return newUser;
}

export async function updateUserProfile(
  email: string,
  updates: { name?: string; phone?: string; area?: string; bio?: string; image?: string }
): Promise<StoredUser | null> {
  const normalized = email.trim().toLowerCase();
  const safeUpdates: Record<string, string> = {};
  if (typeof updates.name === 'string' && updates.name.trim()) safeUpdates.name = updates.name.trim();
  if (typeof updates.phone === 'string') safeUpdates.phone = updates.phone.trim();
  if (typeof updates.area === 'string') safeUpdates.area = updates.area.trim();
  if (typeof updates.bio === 'string') safeUpdates.bio = updates.bio.trim();
  if (typeof updates.image === 'string') safeUpdates.image = updates.image.trim();

  if (useMongo && mongoDb) {
    const res = await mongoDb.collection('users').findOneAndUpdate(
      { email: normalized },
      { $set: safeUpdates },
      { returnDocument: 'after' }
    );
    return res ? (serializeDoc(res as any) as StoredUser) : null;
  }

  const store = loadLocalStore();
  const idx = store.users.findIndex((u) => u.email === normalized);
  if (idx === -1) return null;
  store.users[idx] = { ...store.users[idx], ...safeUpdates };
  saveLocalStore();
  return store.users[idx];
}

export async function listAllUsers(): Promise<UserProfile[]> {
  if (useMongo && mongoDb) {
    const docs = await mongoDb.collection('users').find({}).sort({ createdAt: -1 }).toArray();
    return docs.map((d: any) => {
      const { passwordHash: _pw, ...rest } = serializeDoc(d);
      return rest as UserProfile;
    });
  }
  const store = loadLocalStore();
  return [...store.users]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(({ passwordHash: _pw, ...rest }) => rest);
}

export async function updateUserRoleById(id: string, role: UserRole): Promise<UserProfile | null> {
  if (useMongo && mongoDb) {
    const query = ObjectId.isValid(id) ? { $or: [{ _id: new ObjectId(id) }, { _id: id as any }] } : { _id: id as any };
    const res = await mongoDb.collection('users').findOneAndUpdate(
      query,
      { $set: { role } },
      { returnDocument: 'after' }
    );
    if (!res) return null;
    const { passwordHash: _pw, ...rest } = serializeDoc(res as any);
    return rest as UserProfile;
  }

  const store = loadLocalStore();
  const idx = store.users.findIndex((u) => u._id === id);
  if (idx === -1) return null;
  store.users[idx] = { ...store.users[idx], role };
  saveLocalStore();
  const { passwordHash: _pw, ...rest } = store.users[idx];
  return rest;
}

// ---------------- SESSIONS ----------------

export async function createSessionRecord(userId: string, email: string): Promise<SessionRecord> {
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const record: SessionRecord = {
    _id: generateId(),
    token,
    userId,
    email: email.toLowerCase(),
    expiresAt: expires.toISOString(),
    createdAt: now.toISOString(),
  };

  if (useMongo && mongoDb) {
    await mongoDb.collection('sessions').insertOne({
      ...record,
      _id: new ObjectId(record._id),
    } as any);
    return record;
  }

  const store = loadLocalStore();
  store.sessions.push(record);
  saveLocalStore();
  return record;
}

export async function findSessionByToken(token: string): Promise<SessionRecord | null> {
  if (useMongo && mongoDb) {
    const doc = await mongoDb.collection('sessions').findOne({ token });
    if (!doc) return null;
    const rec = serializeDoc(doc as any) as SessionRecord;
    if (new Date(rec.expiresAt).getTime() < Date.now()) {
      await mongoDb.collection('sessions').deleteOne({ token });
      return null;
    }
    return rec;
  }
  const store = loadLocalStore();
  const idx = store.sessions.findIndex((s) => s.token === token);
  if (idx === -1) return null;
  if (new Date(store.sessions[idx].expiresAt).getTime() < Date.now()) {
    store.sessions.splice(idx, 1);
    saveLocalStore();
    return null;
  }
  return store.sessions[idx];
}

export async function deleteSessionByToken(token: string): Promise<void> {
  if (useMongo && mongoDb) {
    await mongoDb.collection('sessions').deleteOne({ token });
    return;
  }
  const store = loadLocalStore();
  store.sessions = store.sessions.filter((s) => s.token !== token);
  saveLocalStore();
}

// ---------------- SERVICES ----------------

export async function queryPublicServices(params: {
  search?: string;
  category?: string;
  mode?: string;
  sort?: string;
  page?: number;
  limit?: number;
}): Promise<{ services: ServiceItem[]; total: number; page: number; totalPages: number }> {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(params.limit) || 9));
  const skip = (page - 1) * limit;

  if (useMongo && mongoDb) {
    const filter: Record<string, any> = {
      approvalStatus: 'approved',
      isAvailable: true,
    };

    if (params.category && params.category !== 'All') {
      filter.category = params.category;
    }
    if (params.mode && params.mode !== 'All') {
      filter.serviceMode = params.mode;
    }
    if (params.search && params.search.trim()) {
      const escaped = params.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [{ title: { $regex: regex } }, { category: { $regex: regex } }];
    }

    let sortObj: Record<string, 1 | -1> = { createdAt: -1 };
    if (params.sort === 'price-low') sortObj = { basePrice: 1, createdAt: -1 };
    else if (params.sort === 'price-high') sortObj = { basePrice: -1, createdAt: -1 };
    else sortObj = { createdAt: -1 };

    const col = mongoDb.collection('services');
    const total = await col.countDocuments(filter);
    const docs = await col.find(filter).sort(sortObj).skip(skip).limit(limit).toArray();

    return {
      services: docs.map((d: any) => serializeDoc(d) as ServiceItem),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  // Local persistent store executing equivalent $regex, sort(), skip(), limit()
  const store = loadLocalStore();
  const searchRegex =
    params.search && params.search.trim()
      ? new RegExp(params.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      : null;

  let matched = store.services.filter((s) => {
    if (s.approvalStatus !== 'approved' || !s.isAvailable) return false;
    if (params.category && params.category !== 'All' && s.category !== params.category) return false;
    if (params.mode && params.mode !== 'All' && s.serviceMode !== params.mode) return false;
    if (searchRegex && !searchRegex.test(s.title) && !searchRegex.test(s.category)) return false;
    return true;
  });

  if (params.sort === 'price-low') {
    matched = matched.sort((a, b) => a.basePrice - b.basePrice || b.createdAt.localeCompare(a.createdAt));
  } else if (params.sort === 'price-high') {
    matched = matched.sort((a, b) => b.basePrice - a.basePrice || b.createdAt.localeCompare(a.createdAt));
  } else {
    matched = matched.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const total = matched.length;
  const paged = matched.slice(skip, skip + limit);
  return {
    services: paged,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function findServiceById(id: string): Promise<ServiceItem | null> {
  if (useMongo && mongoDb) {
    const query = ObjectId.isValid(id) ? { $or: [{ _id: new ObjectId(id) }, { _id: id as any }] } : { _id: id as any };
    const doc = await mongoDb.collection('services').findOne(query);
    return doc ? (serializeDoc(doc as any) as ServiceItem) : null;
  }
  const store = loadLocalStore();
  return store.services.find((s) => s._id === id) || null;
}

export async function listTechnicianServices(technicianEmail: string): Promise<ServiceItem[]> {
  const email = technicianEmail.toLowerCase();
  if (useMongo && mongoDb) {
    const docs = await mongoDb
      .collection('services')
      .find({ technicianEmail: email })
      .sort({ createdAt: -1 })
      .toArray();
    return docs.map((d: any) => serializeDoc(d) as ServiceItem);
  }
  const store = loadLocalStore();
  return store.services
    .filter((s) => s.technicianEmail === email)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listAllServicesAdmin(): Promise<ServiceItem[]> {
  if (useMongo && mongoDb) {
    const docs = await mongoDb.collection('services').find({}).sort({ createdAt: -1 }).toArray();
    const mapped = docs.map((d: any) => serializeDoc(d) as ServiceItem);
    // Pending first
    return mapped.sort((a, b) => {
      if (a.approvalStatus === 'pending' && b.approvalStatus !== 'pending') return -1;
      if (a.approvalStatus !== 'pending' && b.approvalStatus === 'pending') return 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }
  const store = loadLocalStore();
  return [...store.services].sort((a, b) => {
    if (a.approvalStatus === 'pending' && b.approvalStatus !== 'pending') return -1;
    if (a.approvalStatus !== 'pending' && b.approvalStatus === 'pending') return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export async function createServiceItem(input: {
  title: string;
  category: ServiceCategory;
  description: string;
  image: string;
  basePrice: number;
  estimatedDuration: string;
  serviceMode: ServiceMode;
  serviceArea: string;
  technicianName: string;
  technicianEmail: string;
}): Promise<ServiceItem> {
  const item: ServiceItem = {
    _id: generateId(),
    title: input.title.trim(),
    category: input.category,
    description: input.description.trim(),
    image: input.image,
    basePrice: Number(input.basePrice),
    estimatedDuration: input.estimatedDuration.trim(),
    serviceMode: input.serviceMode,
    serviceArea: input.serviceArea.trim(),
    technicianName: input.technicianName,
    technicianEmail: input.technicianEmail.toLowerCase(),
    approvalStatus: 'pending',
    isAvailable: true,
    createdAt: new Date().toISOString(),
  };

  if (useMongo && mongoDb) {
    await mongoDb.collection('services').insertOne({
      ...item,
      _id: new ObjectId(item._id),
    } as any);
    return item;
  }

  const store = loadLocalStore();
  store.services.push(item);
  saveLocalStore();
  return item;
}

export async function updateServiceItem(
  id: string,
  updates: Partial<ServiceItem>
): Promise<ServiceItem | null> {
  if (useMongo && mongoDb) {
    const query = ObjectId.isValid(id) ? { $or: [{ _id: new ObjectId(id) }, { _id: id as any }] } : { _id: id as any };
    const { _id: _omit, ...safe } = updates as any;
    const res = await mongoDb.collection('services').findOneAndUpdate(
      query,
      { $set: safe },
      { returnDocument: 'after' }
    );
    return res ? (serializeDoc(res as any) as ServiceItem) : null;
  }

  const store = loadLocalStore();
  const idx = store.services.findIndex((s) => s._id === id);
  if (idx === -1) return null;
  store.services[idx] = { ...store.services[idx], ...updates };
  saveLocalStore();
  return store.services[idx];
}

export async function deleteServiceItem(id: string): Promise<boolean> {
  if (useMongo && mongoDb) {
    const query = ObjectId.isValid(id) ? { $or: [{ _id: new ObjectId(id) }, { _id: id as any }] } : { _id: id as any };
    const res = await mongoDb.collection('services').deleteOne(query);
    return res.deletedCount > 0;
  }
  const store = loadLocalStore();
  const before = store.services.length;
  store.services = store.services.filter((s) => s._id !== id);
  saveLocalStore();
  return store.services.length < before;
}

// ---------------- BOOKINGS ----------------

export async function findActiveBookingForCustomerService(
  customerEmail: string,
  serviceId: string
): Promise<BookingItem | null> {
  const email = customerEmail.toLowerCase();
  const activeStatuses: BookingStatus[] = ['requested', 'accepted', 'in-progress'];
  if (useMongo && mongoDb) {
    const doc = await mongoDb.collection('bookings').findOne({
      customerEmail: email,
      serviceId,
      status: { $in: activeStatuses },
    });
    return doc ? (serializeDoc(doc as any) as BookingItem) : null;
  }
  const store = loadLocalStore();
  return (
    store.bookings.find(
      (b) => b.customerEmail === email && b.serviceId === serviceId && activeStatuses.includes(b.status)
    ) || null
  );
}

export async function createBookingRecord(input: Omit<BookingItem, '_id' | 'createdAt'>): Promise<BookingItem> {
  const record: BookingItem = {
    ...input,
    _id: generateId(),
    customerEmail: input.customerEmail.toLowerCase(),
    technicianEmail: input.technicianEmail.toLowerCase(),
    createdAt: new Date().toISOString(),
  };

  if (useMongo && mongoDb) {
    await mongoDb.collection('bookings').insertOne({
      ...record,
      _id: new ObjectId(record._id),
    } as any);
    return record;
  }

  const store = loadLocalStore();
  store.bookings.push(record);
  saveLocalStore();
  return record;
}

export async function findBookingById(id: string): Promise<BookingItem | null> {
  if (useMongo && mongoDb) {
    const query = ObjectId.isValid(id) ? { $or: [{ _id: new ObjectId(id) }, { _id: id as any }] } : { _id: id as any };
    const doc = await mongoDb.collection('bookings').findOne(query);
    return doc ? (serializeDoc(doc as any) as BookingItem) : null;
  }
  const store = loadLocalStore();
  return store.bookings.find((b) => b._id === id) || null;
}

export async function listCustomerBookings(customerEmail: string): Promise<BookingItem[]> {
  const email = customerEmail.toLowerCase();
  if (useMongo && mongoDb) {
    const docs = await mongoDb
      .collection('bookings')
      .find({ customerEmail: email })
      .sort({ createdAt: -1 })
      .toArray();
    return docs.map((d: any) => serializeDoc(d) as BookingItem);
  }
  const store = loadLocalStore();
  return store.bookings
    .filter((b) => b.customerEmail === email)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listTechnicianBookings(
  technicianEmail: string,
  statusFilter?: string
): Promise<BookingItem[]> {
  const email = technicianEmail.toLowerCase();
  if (useMongo && mongoDb) {
    const filter: Record<string, any> = { technicianEmail: email };
    if (statusFilter && statusFilter !== 'all') {
      filter.status = statusFilter;
    }
    const docs = await mongoDb.collection('bookings').find(filter).sort({ createdAt: -1 }).toArray();
    return docs.map((d: any) => serializeDoc(d) as BookingItem);
  }
  const store = loadLocalStore();
  return store.bookings
    .filter((b) => b.technicianEmail === email && (!statusFilter || statusFilter === 'all' || b.status === statusFilter))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listAllBookingsAdmin(statusFilter?: string): Promise<BookingItem[]> {
  if (useMongo && mongoDb) {
    const filter: Record<string, any> = {};
    if (statusFilter && statusFilter !== 'all') {
      filter.status = statusFilter;
    }
    const docs = await mongoDb.collection('bookings').find(filter).sort({ createdAt: -1 }).toArray();
    return docs.map((d: any) => serializeDoc(d) as BookingItem);
  }
  const store = loadLocalStore();
  return store.bookings
    .filter((b) => !statusFilter || statusFilter === 'all' || b.status === statusFilter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateBookingRecord(
  id: string,
  updates: Partial<BookingItem>,
  session?: ClientSession
): Promise<BookingItem | null> {
  if (useMongo && mongoDb) {
    const query = ObjectId.isValid(id) ? { $or: [{ _id: new ObjectId(id) }, { _id: id as any }] } : { _id: id as any };
    const { _id: _omit, ...safe } = updates as any;
    const res = await mongoDb.collection('bookings').findOneAndUpdate(
      query,
      { $set: safe },
      { returnDocument: 'after', session }
    );
    return res ? (serializeDoc(res as any) as BookingItem) : null;
  }

  const store = loadLocalStore();
  const idx = store.bookings.findIndex((b) => b._id === id);
  if (idx === -1) return null;
  store.bookings[idx] = { ...store.bookings[idx], ...updates };
  saveLocalStore();
  return store.bookings[idx];
}

// ---------------- PAYMENTS ----------------

export async function findPaymentByBookingId(bookingId: string): Promise<PaymentItem | null> {
  if (useMongo && mongoDb) {
    const doc = await mongoDb.collection('payments').findOne({ bookingId });
    return doc ? (serializeDoc(doc as any) as PaymentItem) : null;
  }
  const store = loadLocalStore();
  return store.payments.find((p) => p.bookingId === bookingId) || null;
}

export async function findPaymentByStripeSessionId(stripeSessionId: string): Promise<PaymentItem | null> {
  if (useMongo && mongoDb) {
    const doc = await mongoDb.collection('payments').findOne({ stripeSessionId });
    return doc ? (serializeDoc(doc as any) as PaymentItem) : null;
  }
  const store = loadLocalStore();
  return store.payments.find((p) => p.stripeSessionId === stripeSessionId) || null;
}

export async function listCustomerPayments(customerEmail: string): Promise<PaymentItem[]> {
  const email = customerEmail.toLowerCase();
  if (useMongo && mongoDb) {
    const docs = await mongoDb
      .collection('payments')
      .find({ customerEmail: email })
      .sort({ paidAt: -1 })
      .toArray();
    return docs.map((d: any) => serializeDoc(d) as PaymentItem);
  }
  const store = loadLocalStore();
  return store.payments
    .filter((p) => p.customerEmail === email)
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt));
}

export async function listAllPaymentsAdmin(): Promise<PaymentItem[]> {
  if (useMongo && mongoDb) {
    const docs = await mongoDb.collection('payments').find({}).sort({ paidAt: -1 }).toArray();
    return docs.map((d: any) => serializeDoc(d) as PaymentItem);
  }
  const store = loadLocalStore();
  return [...store.payments].sort((a, b) => b.paidAt.localeCompare(a.paidAt));
}

/**
 * Atomically records a verified payment and marks the booking as paid.
 * Idempotent: returns existing payment if bookingId or stripeSessionId already exists.
 */
export async function recordVerifiedPaymentIdempotent(input: {
  bookingId: string;
  stripeSessionId: string;
  transactionId: string;
  amount: number;
  currency: string;
}): Promise<{ payment: PaymentItem; booking: BookingItem }> {
  const existingBySession = await findPaymentByStripeSessionId(input.stripeSessionId);
  if (existingBySession) {
    const booking = await findBookingById(existingBySession.bookingId);
    if (!booking) throw new Error('BOOKING_NOT_FOUND');
    return { payment: existingBySession, booking };
  }

  const existingByBooking = await findPaymentByBookingId(input.bookingId);
  if (existingByBooking) {
    const booking = await findBookingById(existingByBooking.bookingId);
    if (!booking) throw new Error('BOOKING_NOT_FOUND');
    return { payment: existingByBooking, booking };
  }

  const booking = await findBookingById(input.bookingId);
  if (!booking) {
    throw new Error('BOOKING_NOT_FOUND');
  }
  if (booking.status !== 'completed') {
    throw new Error('BOOKING_NOT_COMPLETED');
  }

  const paymentRecord: PaymentItem = {
    _id: generateId(),
    bookingId: booking._id,
    serviceTitle: booking.serviceTitle,
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    technicianName: booking.technicianName,
    technicianEmail: booking.technicianEmail,
    amount: input.amount,
    currency: input.currency.toUpperCase(),
    transactionId: input.transactionId,
    stripeSessionId: input.stripeSessionId,
    paymentStatus: 'paid',
    paidAt: new Date().toISOString(),
  };

  if (useMongo && mongoDb && mongoClient) {
    const session = mongoClient.startSession();
    try {
      let updatedBooking: BookingItem | null = null;
      await session.withTransaction(async () => {
        // Atomic check-and-update inside transaction
        const query = ObjectId.isValid(booking._id)
          ? { $or: [{ _id: new ObjectId(booking._id) }, { _id: booking._id as any }] }
          : { _id: booking._id as any };

        const existingPay = await mongoDb!.collection('payments').findOne(
          { $or: [{ bookingId: booking._id }, { stripeSessionId: input.stripeSessionId }] },
          { session }
        );
        if (existingPay) {
          throw new Error('ALREADY_PAID');
        }

        await mongoDb!.collection('payments').insertOne(
          {
            ...paymentRecord,
            _id: new ObjectId(paymentRecord._id),
          } as any,
          { session }
        );

        const res = await mongoDb!.collection('bookings').findOneAndUpdate(
          { ...query, status: 'completed', paymentStatus: 'unpaid' },
          { $set: { paymentStatus: 'paid' as PaymentStatus } },
          { returnDocument: 'after', session }
        );
        if (!res) {
          throw new Error('BOOKING_UPDATE_CONFLICT');
        }
        updatedBooking = serializeDoc(res as any) as BookingItem;
      });
      return { payment: paymentRecord, booking: updatedBooking || { ...booking, paymentStatus: 'paid' } };
    } catch (err: any) {
      if (err?.message === 'ALREADY_PAID' || err?.code === 11000) {
        const retryPay =
          (await findPaymentByStripeSessionId(input.stripeSessionId)) ||
          (await findPaymentByBookingId(booking._id));
        const retryBooking = await findBookingById(booking._id);
        if (retryPay && retryBooking) {
          return { payment: retryPay, booking: retryBooking };
        }
      }
      // If MongoDB standalone instance does not support multi-doc transactions, execute atomic sequential update
      if (err?.code === 20 || err?.message?.includes('Transaction numbers are only allowed on a replica set')) {
        const bookingUpdate = await mongoDb.collection('bookings').findOneAndUpdate(
          {
            ...(ObjectId.isValid(booking._id) ? { _id: new ObjectId(booking._id) } : { _id: booking._id as any }),
            status: 'completed',
            paymentStatus: 'unpaid',
          },
          { $set: { paymentStatus: 'paid' } },
          { returnDocument: 'after' }
        );
        if (!bookingUpdate) {
          const existingPay = await findPaymentByBookingId(booking._id);
          const existingBk = await findBookingById(booking._id);
          if (existingPay && existingBk) return { payment: existingPay, booking: existingBk };
          throw new Error('BOOKING_UPDATE_CONFLICT');
        }
        await mongoDb.collection('payments').insertOne({
          ...paymentRecord,
          _id: new ObjectId(paymentRecord._id),
        } as any);
        return { payment: paymentRecord, booking: serializeDoc(bookingUpdate as any) as BookingItem };
      }
      throw err;
    } finally {
      await session.endSession();
    }
  }

  // Local store atomic commit
  const store = loadLocalStore();
  if (
    store.payments.some(
      (p) => p.bookingId === booking._id || p.stripeSessionId === input.stripeSessionId
    )
  ) {
    const existingPay =
      store.payments.find((p) => p.stripeSessionId === input.stripeSessionId) ||
      store.payments.find((p) => p.bookingId === booking._id)!;
    const existingBk = store.bookings.find((b) => b._id === booking._id)!;
    return { payment: existingPay, booking: existingBk };
  }

  const bIdx = store.bookings.findIndex((b) => b._id === booking._id);
  if (bIdx === -1) throw new Error('BOOKING_NOT_FOUND');
  store.bookings[bIdx] = { ...store.bookings[bIdx], paymentStatus: 'paid' };
  store.payments.push(paymentRecord);
  saveLocalStore();
  return { payment: paymentRecord, booking: store.bookings[bIdx] };
}

// ---------------- SEED INITIAL DATA ----------------

async function seedInitialData(): Promise<void> {
  const existingUsers = await listAllUsers();
  if (existingUsers.length > 0) return;

  console.log('[FixMate DB] Seeding initial demo accounts, services, and sample repair workflow...');
  const passwordHash = await bcrypt.hash('FixMate123', 10);

  const customer = await createUser({
    name: 'Arif Rahman',
    email: 'customer@fixmate.dev',
    passwordHash,
    role: 'customer',
    phone: '+1 (415) 890-3412',
    area: 'Downtown & Mission District',
    bio: 'Homeowner and startup product lead using FixMate for device and appliance maintenance.',
    image: '',
  });

  const tech1 = await createUser({
    name: 'Tariq Mahmud',
    email: 'tech@fixmate.dev',
    passwordHash,
    role: 'technician',
    phone: '+1 (415) 742-9910',
    area: 'Metro North & Downtown',
    bio: 'Certified micro-soldering specialist & HVAC diagnostics engineer with 9 years of field experience.',
    image: '',
  });

  const tech2 = await createUser({
    name: 'Nadia Karim',
    email: 'nadia.tech@fixmate.dev',
    passwordHash,
    role: 'technician',
    phone: '+1 (415) 602-4481',
    area: 'Westside & Bay Area',
    bio: 'Senior home appliance technician specializing in smart inverter refrigerators, washers, and OLED TVs.',
    image: '',
  });

  await createUser({
    name: 'Daniel Vance',
    email: 'admin@fixmate.dev',
    passwordHash,
    role: 'admin',
    phone: '+1 (415) 555-0199',
    area: 'FixMate Operations HQ',
    bio: 'Platform Quality & Operations Director overseeing technician verification and dispute resolution.',
    image: '',
  });

  const now = Date.now();
  const seedServices: Array<Omit<ServiceItem, '_id'> & { createdAt: string }> = [
    {
      title: 'iPhone & Flagship OLED Display Replacement',
      category: 'Smartphone',
      description:
        'Factory-calibrated OLED screen assembly replacement with TrueTone programming, waterproof perimeter resealing, and full touch-digitizer diagnostics. Includes a 180-day parts and labor warranty.',
      image: '/src/assets/images/service_smartphone_1795006392558.jpg',
      basePrice: 129,
      estimatedDuration: '45 mins',
      serviceMode: 'Home Visit',
      serviceArea: 'Metro North & Downtown',
      technicianName: tech1.name,
      technicianEmail: tech1.email,
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: new Date(now - 1000 * 60 * 60 * 1).toISOString(),
    },
    {
      title: 'MacBook & Ultrabook Logic Board + Thermal Overhaul',
      category: 'Laptop & PC',
      description:
        'Complete ultrasonic motherboard cleaning, phase-change thermal paste renewal, cooling fan calibration, and power-rail diagnostics for overheating or non-booting laptops.',
      image: '/src/assets/images/service_laptop_1795006393752.jpg',
      basePrice: 149,
      estimatedDuration: '90 mins',
      serviceMode: 'Shop Drop-off',
      serviceArea: 'Metro North & Downtown',
      technicianName: tech1.name,
      technicianEmail: tech1.email,
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      title: 'Inverter Split AC Deep Servicing & Gas Top-Up',
      category: 'AC',
      description:
        'High-pressure coil jet wash, drain line vacuum clearance, digital manifold refrigerant pressure check, and inverter PCB amperage inspection for peak cooling efficiency.',
      image: '/src/assets/images/service_ac_unit_1795006393640.jpg',
      basePrice: 89,
      estimatedDuration: '75 mins',
      serviceMode: 'Home Visit',
      serviceArea: 'Metro North & Downtown',
      technicianName: tech1.name,
      technicianEmail: tech1.email,
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
    },
    {
      title: 'Smart French-Door Refrigerator Compressor & Cooling Fix',
      category: 'Refrigerator',
      description:
        'Diagnostic sweep for frost buildup, inverter compressor relay replacement, thermistor calibration, and sealed-system leak check for modern smart refrigerators.',
      image: '/src/assets/images/service_appliance_1795006394357.jpg',
      basePrice: 115,
      estimatedDuration: '90 mins',
      serviceMode: 'Home Visit',
      serviceArea: 'Westside & Bay Area',
      technicianName: tech2.name,
      technicianEmail: tech2.email,
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: new Date(now - 1000 * 60 * 60 * 4).toISOString(),
    },
    {
      title: 'OLED & 4K Smart TV Backlight & T-Con Repair',
      category: 'TV',
      description:
        'Precision power-supply board repair, T-Con timing controller replacement, and LED backlight strip restoration with full color uniformity verification.',
      image: '/src/assets/images/service_tv_electrical_1795006395255.jpg',
      basePrice: 135,
      estimatedDuration: '2 hours',
      serviceMode: 'Home Visit',
      serviceArea: 'Westside & Bay Area',
      technicianName: tech2.name,
      technicianEmail: tech2.email,
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
    },
    {
      title: 'Front-Load Washing Machine Drum & Drain Pump Repair',
      category: 'Washing Machine',
      description:
        'Resolves spin vibration, E-code drainage errors, door boot gasket leaks, and brushless motor Hall-sensor faults with OEM-grade replacement components.',
      image: '/src/assets/images/service_appliance_1795006394357.jpg',
      basePrice: 95,
      estimatedDuration: '60 mins',
      serviceMode: 'Home Visit',
      serviceArea: 'Westside & Bay Area',
      technicianName: tech2.name,
      technicianEmail: tech2.email,
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
    },
    {
      title: 'Home Breaker Panel & Smart Surge Protection Diagnostics',
      category: 'Electrical',
      description:
        'Licensed electrical load balancing, GFCI/AFCI breaker replacement, earthing impedance testing, and whole-home smart surge protector installation.',
      image: '/src/assets/images/service_tv_electrical_1795006395255.jpg',
      basePrice: 110,
      estimatedDuration: '75 mins',
      serviceMode: 'Home Visit',
      serviceArea: 'Metro North & Downtown',
      technicianName: tech1.name,
      technicianEmail: tech1.email,
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: new Date(now - 1000 * 60 * 60 * 7).toISOString(),
    },
    {
      title: 'Smartphone Battery & Charging Port Micro-Soldering',
      category: 'Smartphone',
      description:
        'Same-day genuine capacity battery swap and USB-C/Lightning port board restoration with charging IC voltage verification.',
      image: '/src/assets/images/service_smartphone_1795006392558.jpg',
      basePrice: 69,
      estimatedDuration: '35 mins',
      serviceMode: 'Shop Drop-off',
      serviceArea: 'Metro North & Downtown',
      technicianName: tech1.name,
      technicianEmail: tech1.email,
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: new Date(now - 1000 * 60 * 60 * 8).toISOString(),
    },
    {
      title: 'Custom Workstation PC GPU & Liquid Cooling Service',
      category: 'Laptop & PC',
      description:
        'Full desktop loop flush, PSU rail stress test, BIOS tuning, and NVMe thermal pad upgrade for creator and engineering workstations.',
      image: '/src/assets/images/service_laptop_1795006393752.jpg',
      basePrice: 165,
      estimatedDuration: '2 hours',
      serviceMode: 'Shop Drop-off',
      serviceArea: 'Westside & Bay Area',
      technicianName: tech2.name,
      technicianEmail: tech2.email,
      approvalStatus: 'pending',
      isAvailable: true,
      createdAt: new Date(now - 1000 * 60 * 30).toISOString(),
    },
  ];

  const createdServices: ServiceItem[] = [];
  for (const svc of seedServices) {
    const item: ServiceItem = { ...svc, _id: generateId() };
    if (useMongo && mongoDb) {
      await mongoDb.collection('services').insertOne({ ...item, _id: new ObjectId(item._id) } as any);
    } else {
      const store = loadLocalStore();
      store.services.push(item);
    }
    createdServices.push(item);
  }
  if (!useMongo) saveLocalStore();

  // Seed realistic sample bookings across statuses so Customer, Technician & Admin dashboards are rich immediately
  const bk1 = await createBookingRecord({
    serviceId: createdServices[2]._id,
    serviceTitle: createdServices[2].title,
    serviceImage: createdServices[2].image,
    category: createdServices[2].category,
    basePrice: createdServices[2].basePrice,
    technicianName: tech1.name,
    technicianEmail: tech1.email,
    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    address: '742 Evergreen Terrace, Apt 4B, Downtown',
    preferredDate: new Date(now + 1000 * 60 * 60 * 24 * 2).toISOString().slice(0, 10),
    problemDescription: 'Living room split AC blows warm air after 10 minutes and blinks an E4 coil sensor code.',
    status: 'completed',
    finalAmount: 105,
    paymentStatus: 'unpaid',
  });

  const bk2 = await createBookingRecord({
    serviceId: createdServices[0]._id,
    serviceTitle: createdServices[0].title,
    serviceImage: createdServices[0].image,
    category: createdServices[0].category,
    basePrice: createdServices[0].basePrice,
    technicianName: tech1.name,
    technicianEmail: tech1.email,
    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    address: '742 Evergreen Terrace, Apt 4B, Downtown',
    preferredDate: new Date(now + 1000 * 60 * 60 * 24 * 3).toISOString().slice(0, 10),
    problemDescription: 'Cracked lower-right OLED corner causing intermittent ghost touches along the keyboard row.',
    status: 'requested',
    finalAmount: 129,
    paymentStatus: 'unpaid',
  });

  const bk3 = await createBookingRecord({
    serviceId: createdServices[3]._id,
    serviceTitle: createdServices[3].title,
    serviceImage: createdServices[3].image,
    category: createdServices[3].category,
    basePrice: createdServices[3].basePrice,
    technicianName: tech2.name,
    technicianEmail: tech2.email,
    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    address: '742 Evergreen Terrace, Apt 4B, Downtown',
    preferredDate: new Date(now - 1000 * 60 * 60 * 24 * 6).toISOString().slice(0, 10),
    problemDescription: 'Fresh food compartment temperature drifted to 52F while the freezer remained frozen.',
    status: 'completed',
    finalAmount: 140,
    paymentStatus: 'paid',
  });

  // Seed paid transaction for bk3
  const seedPayment: PaymentItem = {
    _id: generateId(),
    bookingId: bk3._id,
    serviceTitle: bk3.serviceTitle,
    customerName: bk3.customerName,
    customerEmail: bk3.customerEmail,
    technicianName: bk3.technicianName,
    technicianEmail: bk3.technicianEmail,
    amount: 140,
    currency: 'USD',
    transactionId: 'pi_3QFixMateSeed001',
    stripeSessionId: 'cs_test_seed_session_001',
    paymentStatus: 'paid',
    paidAt: new Date(now - 1000 * 60 * 60 * 24 * 5).toISOString(),
  };

  if (useMongo && mongoDb) {
    await mongoDb.collection('payments').insertOne({
      ...seedPayment,
      _id: new ObjectId(seedPayment._id),
    } as any);
  } else {
    const store = loadLocalStore();
    store.payments.push(seedPayment);
    saveLocalStore();
  }

  // Keep bk1 unpaid so customer can test Pay Now immediately, bk2 requested so tech can accept/reject!
  void bk1;
  void bk2;
}
