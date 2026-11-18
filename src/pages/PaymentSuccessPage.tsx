import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import type { BookingItem, PaymentItem } from '../shared/types.ts';

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payment, setPayment] = useState<PaymentItem | null>(null);
  const [booking, setBooking] = useState<BookingItem | null>(null);

  useEffect(() => {
    let active = true;
    async function verify() {
      if (!sessionId) {
        setError('Missing Stripe session ID.');
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/payments/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Could not verify payment session.');
        }
        if (active) {
          setPayment(data.payment);
          setBooking(data.booking);
        }
      } catch (err: any) {
        if (active) setError(err?.message || 'Payment verification failed.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void verify();
    return () => {
      active = false;
    };
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center bg-[#F7F9FC] dark:bg-[#0B1120] p-6">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#3867FF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-[#68758A] dark:text-slate-400">
            Verifying Stripe payment...
          </p>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center bg-[#F7F9FC] dark:bg-[#0B1120] p-6">
        <div className="max-w-md w-full bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 inline-flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold text-[#101B35] dark:text-white">
            Verification Issue
          </h1>
          <p className="text-sm text-[#68758A] dark:text-slate-400">{error}</p>
          <Link
            to="/dashboard/customer/bookings"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#3867FF] text-white text-sm font-semibold"
          >
            <span>Return to My Bookings</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[78vh] flex items-center justify-center bg-[#F7F9FC] dark:bg-[#0B1120] px-4 py-12">
      <div className="max-w-lg w-full bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 inline-flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#101B35] dark:text-white tracking-tight">
            Payment Successful
          </h1>
          <p className="text-sm text-[#68758A] dark:text-slate-400">
            Your repair invoice has been settled and your receipt has been recorded.
          </p>
        </div>

        <div className="rounded-xl bg-[#F7F9FC] dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-5 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[#68758A] dark:text-slate-400">Amount Paid</span>
            <span className="text-lg font-extrabold text-[#101B35] dark:text-white tabular-nums">
              ${payment.amount.toFixed(2)} {payment.currency}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[#68758A] dark:text-slate-400">Transaction ID</span>
            <span className="font-mono text-xs text-[#172033] dark:text-slate-200 truncate max-w-[240px]">
              {payment.transactionId}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[#68758A] dark:text-slate-400">Service</span>
            <span className="font-semibold text-[#172033] dark:text-white text-right">
              {payment.serviceTitle}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[#68758A] dark:text-slate-400">Technician</span>
            <span className="font-medium text-[#172033] dark:text-slate-200">
              {payment.technicianName}
            </span>
          </div>
          {booking && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-[#68758A] dark:text-slate-400">Booking Reference</span>
              <span className="font-mono text-xs text-[#68758A] dark:text-slate-400">
                {booking._id.slice(-8)}
              </span>
            </div>
          )}
        </div>

        <Link
          to="/dashboard/customer/bookings"
          className="w-full h-11 rounded-lg bg-[#3867FF] hover:bg-[#2B54DB] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
        >
          <span>Return to My Bookings</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
