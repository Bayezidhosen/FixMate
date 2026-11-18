import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardList, Wrench, CheckCircle2 } from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout.tsx';
import { StatusBadge } from '../../components/StatusBadge.tsx';
import type { BookingItem } from '../../shared/types.ts';

export function CustomerOverviewPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch('/api/bookings/my', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (active) setBookings(data.bookings || []);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const totalRequests = bookings.length;
  const activeJobs = bookings.filter((b) =>
    ['requested', 'accepted', 'in-progress'].includes(b.status)
  ).length;
  const completedJobs = bookings.filter((b) => b.status === 'completed').length;

  return (
    <DashboardLayout allowedRoles={['customer']} title="Customer Overview">
      <div className="space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#68758A] dark:text-slate-400">
                Total Requests
              </p>
              <p className="text-3xl font-extrabold text-[#101B35] dark:text-white tabular-nums mt-1">
                {loading ? '—' : totalRequests}
              </p>
            </div>
            <ClipboardList className="w-6 h-6 text-[#3867FF]" />
          </div>

          <div className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#68758A] dark:text-slate-400">
                Active Jobs
              </p>
              <p className="text-3xl font-extrabold text-[#101B35] dark:text-white tabular-nums mt-1">
                {loading ? '—' : activeJobs}
              </p>
            </div>
            <Wrench className="w-6 h-6 text-cyan-500" />
          </div>

          <div className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#68758A] dark:text-slate-400">
                Completed Jobs
              </p>
              <p className="text-3xl font-extrabold text-[#101B35] dark:text-white tabular-nums mt-1">
                {loading ? '—' : completedJobs}
              </p>
            </div>
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-base font-bold text-[#101B35] dark:text-white">
              Recent Repair Requests
            </h2>
            <Link
              to="/dashboard/customer/bookings"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#3867FF] dark:text-[#22D3EE] hover:underline"
            >
              <span>Manage All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-[#68758A]">Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <p className="text-sm text-[#68758A] dark:text-slate-400">
                You haven&apos;t requested any repairs yet.
              </p>
              <Link
                to="/services"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3867FF] text-white text-xs font-semibold"
              >
                <span>Browse Services</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F7F9FC] dark:bg-[#0B1120] text-xs font-semibold text-[#68758A] dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3">Service</th>
                    <th className="px-6 py-3">Technician</th>
                    <th className="px-6 py-3">Preferred Date</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {bookings.slice(0, 5).map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                      <td className="px-6 py-3.5 font-semibold text-[#172033] dark:text-white">
                        {b.serviceTitle}
                      </td>
                      <td className="px-6 py-3.5 text-[#68758A] dark:text-slate-300">
                        {b.technicianName}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-xs text-[#68758A] dark:text-slate-400 tabular-nums">
                        {b.preferredDate}
                      </td>
                      <td className="px-6 py-3.5 text-right font-bold tabular-nums">
                        ${b.finalAmount}
                      </td>
                      <td className="px-6 py-3.5">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="px-6 py-3.5">
                        <StatusBadge status={b.paymentStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
