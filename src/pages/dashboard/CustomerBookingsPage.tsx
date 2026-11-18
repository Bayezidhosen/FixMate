import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { CreditCard, XCircle } from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout.tsx';
import { SafeImage } from '../../components/SafeImage.tsx';
import { StatusBadge } from '../../components/StatusBadge.tsx';
import type { BookingItem } from '../../shared/types.ts';

export function CustomerBookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadBookings = async () => {
    try {
      const res = await fetch('/api/bookings/my', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBookings();
  }, []);

  const handleCancel = async (bookingId: string) => {
    setBusyId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Could not cancel booking.');
        return;
      }
      setBookings((prev) => prev.map((b) => (b._id === bookingId ? data.booking : b)));
      toast.success('Repair request cancelled.');
    } catch {
      toast.error('Network error cancelling booking.');
    } finally {
      setBusyId(null);
    }
  };

  const handlePayNow = async (bookingId: string) => {
    setBusyId(bookingId);
    try {
      const res = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Could not initiate payment.');
        return;
      }
      if (data.url) {
        window.location.assign(data.url);
      }
    } catch {
      toast.error('Network error initiating Stripe checkout.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <DashboardLayout allowedRoles={['customer']} title="My Bookings">
      <div className="space-y-6">
        {loading ? (
          <div className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-sm text-[#68758A]">
            Loading your repair bookings...
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center space-y-4">
            <h2 className="text-lg font-bold text-[#101B35] dark:text-white">No bookings yet</h2>
            <p className="text-sm text-[#68758A] dark:text-slate-400">
              Explore verified repair services and schedule your first job.
            </p>
            <Link
              to="/services"
              className="inline-block px-5 py-2.5 rounded-lg bg-[#3867FF] text-white text-sm font-semibold"
            >
              Browse Services
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => {
              const canCancel = b.status === 'requested';
              const canPay = b.status === 'completed' && b.paymentStatus === 'unpaid';
              const isBusy = busyId === b._id;

              return (
                <div
                  key={b._id}
                  className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between"
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 shrink-0">
                      <SafeImage
                        src={b.serviceImage}
                        alt={b.serviceTitle}
                        fallbackLabel={b.category}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#68758A] dark:text-slate-400">
                        <span className="font-semibold text-[#3867FF] dark:text-[#22D3EE]">
                          {b.category}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>Technician: {b.technicianName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">Date: {b.preferredDate}</span>
                      </div>
                      <h3 className="text-base font-bold text-[#101B35] dark:text-white">
                        {b.serviceTitle}
                      </h3>
                      <p className="text-xs text-[#68758A] dark:text-slate-400 line-clamp-2">
                        {b.problemDescription}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                        <span className="text-[#68758A] dark:text-slate-400 tabular-nums">
                          Base: <strong className="text-[#172033] dark:text-white">${b.basePrice}</strong>
                        </span>
                        <span className="text-[#68758A] dark:text-slate-400 tabular-nums">
                          Final Amount:{' '}
                          <strong className="text-[#101B35] dark:text-white text-sm">
                            ${b.finalAmount}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={b.status} />
                      <StatusBadge status={b.paymentStatus} />
                    </div>

                    {canCancel && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleCancel(b._id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{isBusy ? 'Cancelling...' : 'Cancel Request'}</span>
                      </button>
                    )}

                    {canPay && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handlePayNow(b._id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3867FF] hover:bg-[#2B54DB] text-white text-xs font-semibold disabled:opacity-50 transition-colors"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{isBusy ? 'Redirecting...' : `Pay Now ($${b.finalAmount})`}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
