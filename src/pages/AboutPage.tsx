import { Link } from 'react-router-dom';
import { ShieldCheck, Wrench, CreditCard, CheckCircle2, ArrowRight } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="bg-[#F7F9FC] dark:bg-[#0B1120] py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        <div className="space-y-4 max-w-3xl">
          <p className="text-xs font-semibold text-[#3867FF] dark:text-[#22D3EE]">
            How FixMate Works
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#101B35] dark:text-white tracking-tight">
            Built for transparent, accountable device and appliance repair.
          </h1>
          <p className="text-base text-[#68758A] dark:text-slate-300 leading-relaxed">
            FixMate replaces opaque phone quotes and unverified contractors with a structured workflow connecting customers, vetted technicians, and platform oversight from initial booking to Stripe settlement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
            <ShieldCheck className="w-6 h-6 text-[#3867FF] dark:text-[#22D3EE]" />
            <h2 className="text-lg font-bold text-[#101B35] dark:text-white">
              Admin-Verified Catalog
            </h2>
            <p className="text-sm text-[#68758A] dark:text-slate-400 leading-relaxed">
              Every service submitted or edited by a technician enters a review queue. Only admin-approved listings are visible to customers.
            </p>
          </div>

          <div className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
            <Wrench className="w-6 h-6 text-[#3867FF] dark:text-[#22D3EE]" />
            <h2 className="text-lg font-bold text-[#101B35] dark:text-white">
              Strict Job Lifecycle
            </h2>
            <p className="text-sm text-[#68758A] dark:text-slate-400 leading-relaxed">
              Requests move cleanly through Requested, Accepted, In Progress, and Completed states with server-enforced ownership and transition rules.
            </p>
          </div>

          <div className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
            <CreditCard className="w-6 h-6 text-[#3867FF] dark:text-[#22D3EE]" />
            <h2 className="text-lg font-bold text-[#101B35] dark:text-white">
              Pay After Completion
            </h2>
            <p className="text-sm text-[#68758A] dark:text-slate-400 leading-relaxed">
              Customers never pre-pay blindly. Stripe Checkout unlocks only after the technician completes the repair and logs the final verified invoice.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-8 space-y-6">
          <h2 className="text-xl font-extrabold text-[#101B35] dark:text-white">
            End-to-End Accountability
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-[#172033] dark:text-slate-200">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#3867FF] mt-0.5 shrink-0" />
              <span>Customers can cancel pending requests anytime before technician acceptance.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#3867FF] mt-0.5 shrink-0" />
              <span>Duplicate active requests for the same service are automatically prevented.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#3867FF] mt-0.5 shrink-0" />
              <span>Idempotent payment processing prevents duplicate charges or double receipts.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#3867FF] mt-0.5 shrink-0" />
              <span>JWT + HTTPOnly cookie verification secures every role-scoped endpoint.</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/services"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#3867FF] hover:bg-[#2B54DB] text-white text-sm font-semibold transition-colors"
            >
              <span>Browse Repair Services</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
