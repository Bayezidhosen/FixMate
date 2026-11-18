import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface LocalSessionInfo {
  sessionId: string;
  bookingId: string;
  customerEmail: string;
  amount: number;
  serviceTitle: string;
  technicianName: string;
}

export function StripeTestCheckoutPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id') || '';
  const navigate = useNavigate();

  const [session, setSession] = useState<LocalSessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('424');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!sessionId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/payments/local-session/${encodeURIComponent(sessionId)}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (active) setSession(data.session);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [sessionId]);

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = cardNumber.replace(/\s+/g, '');
    if (digits.length < 16) {
      toast.error('Enter a valid 16-digit Stripe test card (e.g., 4242 4242 4242 4242).');
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      toast.error('Enter a valid future expiration date (MM/YY).');
      return;
    }
    if (cvc.length < 3) {
      toast.error('Enter a valid 3-digit CVC.');
      return;
    }

    setProcessing(true);
    setTimeout(() => {
      navigate(`/payment/success?session_id=${encodeURIComponent(sessionId)}`);
    }, 500);
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#3867FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h1 className="text-lg font-bold">Checkout session unavailable</h1>
          <button
            type="button"
            onClick={() => navigate('/dashboard/customer/bookings')}
            className="px-5 py-2.5 rounded-lg bg-[#3867FF] text-white text-sm font-semibold"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-[#F7F9FC] dark:bg-[#0B1120] py-12 px-4">
      <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Summary */}
        <div className="md:col-span-5 space-y-5">
          <button
            type="button"
            onClick={() => navigate('/payment/cancel')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#68758A] hover:text-[#101B35] dark:hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel &amp; Return</span>
          </button>

          <div className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <p className="text-xs font-semibold text-[#3867FF] dark:text-[#22D3EE]">
              Stripe Test Mode Checkout
            </p>
            <div>
              <p className="text-xs text-[#68758A] dark:text-slate-400">Amount Due</p>
              <p className="text-3xl font-extrabold text-[#101B35] dark:text-white tabular-nums mt-0.5">
                ${session.amount.toFixed(2)}
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1 text-sm">
              <p className="font-bold text-[#172033] dark:text-white">{session.serviceTitle}</p>
              <p className="text-xs text-[#68758A] dark:text-slate-400">
                Technician: {session.technicianName}
              </p>
            </div>
            <p className="text-[11px] text-[#68758A] dark:text-slate-400 leading-relaxed">
              Local Test Mode active because STRIPE_SECRET_KEY is not set in environment variables.
            </p>
          </div>
        </div>

        {/* Card Form */}
        <div className="md:col-span-7 bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8">
          <form onSubmit={handlePay} className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-extrabold text-[#101B35] dark:text-white">
                Pay with Test Card
              </h1>
              <CreditCard className="w-5 h-5 text-[#3867FF]" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#68758A] dark:text-slate-400 mb-1">
                Email
              </label>
              <input
                type="email"
                readOnly
                value={session.customerEmail}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-sm text-[#68758A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1">
                Card Number (Test: 4242 4242 4242 4242)
              </label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#3867FF]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1">
                  Expiration (MM/YY)
                </label>
                <input
                  type="text"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#3867FF]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1">
                  CVC
                </label>
                <input
                  type="text"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#3867FF]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full h-11 rounded-lg bg-[#101B35] dark:bg-[#3867FF] hover:bg-[#3867FF] dark:hover:bg-[#2B54DB] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
            >
              <Lock className="w-4 h-4" />
              <span>{processing ? 'Processing...' : `Pay $${session.amount.toFixed(2)}`}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
