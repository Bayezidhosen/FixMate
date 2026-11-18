import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Clock,
  MapPin,
  ShieldCheck,
  Wrench,
  Calendar,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { SafeImage } from '../components/SafeImage.tsx';
import { LoadingPage } from '../components/ErrorBoundary.tsx';
import type { ServiceItem } from '../shared/types.ts';

const todayStr = () => new Date().toISOString().slice(0, 10);

const bookingSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^[+\d\s()-]{7,20}$/, 'Enter a valid phone number (7–20 characters).'),
  address: z.string().trim().min(5, 'Please provide your complete street address.'),
  preferredDate: z
    .string()
    .min(1, 'Preferred date is required.')
    .refine((val) => val >= todayStr(), 'Preferred date must be today or in the future.'),
  problemDescription: z
    .string()
    .trim()
    .min(20, 'Please describe the issue in at least 20 characters.'),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface TechnicianSummary {
  name: string;
  email: string;
  area: string;
  bio: string;
  image: string;
}

export function ServiceDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [service, setService] = useState<ServiceItem | null>(null);
  const [technician, setTechnician] = useState<TechnicianSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      phone: '',
      address: '',
      preferredDate: todayStr(),
      problemDescription: '',
    },
  });

  useEffect(() => {
    if (user?.phone) {
      setValue('phone', user.phone);
    }
  }, [user, setValue]);

  useEffect(() => {
    let active = true;
    async function loadDetails() {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await fetch(`/api/services/${id}`, { credentials: 'include' });
        if (!res.ok) {
          if (active) setNotFound(true);
          return;
        }
        const data = await res.json();
        if (active) {
          setService(data.service);
          setTechnician(data.technician || null);
        }
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    if (id) void loadDetails();
    return () => {
      active = false;
    };
  }, [id]);

  const onSubmit = async (values: BookingFormValues) => {
    if (!service) return;
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          serviceId: service._id,
          ...values,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Could not submit repair request.');
        return;
      }
      toast.success('Repair request submitted! Track progress in My Bookings.');
      navigate('/dashboard/customer/bookings');
    } catch {
      toast.error('Network error while submitting request.');
    }
  };

  if (loading) return <LoadingPage />;

  if (notFound || !service) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-extrabold text-[#101B35] dark:text-white">
          Service not found
        </h1>
        <p className="text-sm text-[#68758A] dark:text-slate-400">
          This repair service is unavailable or has been removed.
        </p>
        <Link
          to="/services"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#3867FF] text-white text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Services</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#F7F9FC] dark:bg-[#0B1120] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Link
          to="/services"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#68758A] dark:text-slate-400 hover:text-[#3867FF] dark:hover:text-[#22D3EE]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Services</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Service Details */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="aspect-16/10 w-full bg-slate-100 dark:bg-slate-900">
                <SafeImage
                  src={service.image}
                  alt={service.title}
                  fallbackLabel={service.category}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6 sm:p-8 space-y-5">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#68758A] dark:text-slate-400">
                  <span className="text-[#3867FF] dark:text-[#22D3EE]">{service.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{service.serviceMode}</span>
                  <span aria-hidden="true">·</span>
                  <span>{service.serviceArea}</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#101B35] dark:text-white tracking-tight">
                  {service.title}
                </h1>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 border-y border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-xs text-[#68758A] dark:text-slate-400">Starting Price</p>
                    <p className="text-xl font-extrabold text-[#101B35] dark:text-white tabular-nums mt-0.5">
                      ${service.basePrice}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#68758A] dark:text-slate-400">Est. Turnaround</p>
                    <p className="text-sm font-bold text-[#172033] dark:text-white inline-flex items-center gap-1.5 mt-1">
                      <Clock className="w-4 h-4 text-[#3867FF]" />
                      <span>{service.estimatedDuration}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#68758A] dark:text-slate-400">Coverage Area</p>
                    <p className="text-sm font-bold text-[#172033] dark:text-white inline-flex items-center gap-1.5 mt-1">
                      <MapPin className="w-4 h-4 text-[#3867FF]" />
                      <span>{service.serviceArea}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-base font-bold text-[#101B35] dark:text-white">
                    Scope of Repair
                  </h2>
                  <p className="text-sm text-[#68758A] dark:text-slate-300 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-start gap-4">
                  <div className="w-11 h-11 rounded-lg bg-[#101B35] dark:bg-[#3867FF] text-white font-bold text-sm inline-flex items-center justify-center shrink-0">
                    {service.technicianName
                      .split(' ')
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[#3867FF] dark:text-[#22D3EE]">
                      Assigned Specialist
                    </p>
                    <p className="text-sm font-bold text-[#101B35] dark:text-white">
                      {service.technicianName}
                    </p>
                    <p className="text-xs text-[#68758A] dark:text-slate-400">
                      {technician?.bio || `Verified ${service.category} repair technician serving ${service.serviceArea}.`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Repair Request Panel */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-7 space-y-5 sticky top-24">
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-[#101B35] dark:text-white">
                  Request This Repair
                </h2>
                <p className="text-xs text-[#68758A] dark:text-slate-400">
                  No upfront payment required. Pay securely via Stripe only after completion.
                </p>
              </div>

              {!user ? (
                <div className="p-5 rounded-xl bg-[#F7F9FC] dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-[#3867FF] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-[#101B35] dark:text-white">
                        Sign in required to book
                      </p>
                      <p className="text-xs text-[#68758A] dark:text-slate-400">
                        Sign in with your FixMate customer account to submit this repair request. You will be returned directly to this page.
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/sign-in?redirect=${encodeURIComponent(`/services/${service._id}`)}`}
                    className="w-full py-2.5 px-4 rounded-lg bg-[#3867FF] hover:bg-[#2B54DB] text-white text-sm font-semibold text-center block transition-colors"
                  >
                    Sign In to Continue
                  </Link>
                </div>
              ) : user.role !== 'customer' ? (
                <div className="p-5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
                    <Wrench className="w-4 h-4" />
                    <span>Customer Account Required</span>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-300/90 leading-relaxed">
                    You are currently signed in as a <strong className="capitalize">{user.role}</strong>. Only Customer accounts can submit repair requests.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#68758A] dark:text-slate-400 mb-1">
                        Customer Name
                      </label>
                      <input
                        type="text"
                        value={user.name}
                        readOnly
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/70 text-sm text-[#68758A] dark:text-slate-300 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#68758A] dark:text-slate-400 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={user.email}
                        readOnly
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/70 text-sm text-[#68758A] dark:text-slate-300 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      {...register('phone')}
                      placeholder="+1 (415) 555-0142"
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm focus:outline-none focus:ring-2 focus:ring-[#3867FF]"
                    />
                    {errors.phone && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1">
                      Service Address
                    </label>
                    <input
                      type="text"
                      {...register('address')}
                      placeholder="Street, apartment/suite, neighborhood"
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm focus:outline-none focus:ring-2 focus:ring-[#3867FF]"
                    />
                    {errors.address && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                        {errors.address.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1">
                      Preferred Date
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-[#68758A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="date"
                        min={todayStr()}
                        {...register('preferredDate')}
                        className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm focus:outline-none focus:ring-2 focus:ring-[#3867FF]"
                      />
                    </div>
                    {errors.preferredDate && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                        {errors.preferredDate.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1">
                      Problem Description (min 20 characters)
                    </label>
                    <textarea
                      rows={4}
                      {...register('problemDescription')}
                      placeholder="Describe symptoms, error codes, or when the issue started..."
                      className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm focus:outline-none focus:ring-2 focus:ring-[#3867FF]"
                    />
                    {errors.problemDescription && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                        {errors.problemDescription.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 rounded-lg bg-[#3867FF] hover:bg-[#2B54DB] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                  >
                    {isSubmitting ? 'Submitting Request...' : 'Submit Repair Request'}
                  </button>

                  <p className="flex items-center justify-center gap-1.5 text-xs text-[#68758A] dark:text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#3867FF]" />
                    <span>Protected by FixMate post-completion payment policy</span>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
