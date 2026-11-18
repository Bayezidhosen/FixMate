import { Link } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';

export function PaymentCancelPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center bg-[#F7F9FC] dark:bg-[#0B1120] px-4 py-12">
      <div className="max-w-md w-full bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-5">
        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 inline-flex items-center justify-center mx-auto">
          <XCircle className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-[#101B35] dark:text-white tracking-tight">
            Payment Cancelled
          </h1>
          <p className="text-sm text-[#68758A] dark:text-slate-400">
            No charges were made and your booking remains unpaid. You can retry payment anytime from your bookings dashboard.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            to="/dashboard/customer/bookings"
            className="flex-1 h-11 rounded-lg bg-[#3867FF] hover:bg-[#2B54DB] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
          >
            <span>Try Again</span>
          </Link>
          <Link
            to="/services"
            className="flex-1 h-11 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Services</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
