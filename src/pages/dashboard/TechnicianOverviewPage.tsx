import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, ShieldCheck, Inbox, ArrowRight } from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout.tsx';
import { StatusBadge } from '../../components/StatusBadge.tsx';
import type { BookingItem, ServiceItem } from '../../shared/types.ts';

export function TechnicianOverviewPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [svcRes, bkRes] = await Promise.all([
          fetch('/api/services/technician', { credentials: 'include' }),
          fetch('/api/bookings/technician', { credentials: 'include' }),
        ]);
        if (active) {
          if (svcRes.ok) {
            const d = await svcRes.json();
            setServices(d.services || []);
          }
          if (bkRes.ok) {
            const d = await bkRes.json();
            setBookings(d.bookings || []);
          }
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

  const totalServices = services.length;
  const approvedServices = services.filter((s) => s.approvalStatus === 'approved').length;
  const pendingRequests = bookings.filter((b) => b.status === 'requested').length;

  return (
    <DashboardLayout allowedRoles={['technician']} title="Technician Overview">
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#68758A] dark:text-slate-400">
                Total Services
              </p>
              <p className="text-3xl font-extrabold text-[#101B35] dark:text-white tabular-nums mt-1">
                {loading ? '—' : totalServices}
              </p>
            </div>
            <Wrench className="w-6 h-6 text-[#3867FF]" />
          </div>

          <div className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#68758A] dark:text-slate-400">
                Approved Services
              </p>
              <p className="text-3xl font-extrabold text-[#101B35] dark:text-white tabular-nums mt-1">
                {loading ? '—' : approvedServices}
              </p>
            </div>
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
          </div>

          <div className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#68758A] dark:text-slate-400">
                Pending Requests
              </p>
              <p className="text-3xl font-extrabold text-[#101B35] dark:text-white tabular-nums mt-1">
                {loading ? '—' : pendingRequests}
              </p>
            </div>
            <Inbox className="w-6 h-6 text-amber-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-base font-bold text-[#101B35] dark:text-white">
              Incoming Repair Requests
            </h2>
            <Link
              to="/dashboard/technician/requests"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#3867FF] dark:text-[#22D3EE] hover:underline"
            >
              <span>Manage Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-[#68758A]">Loading requests...</div>
          ) : bookings.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#68758A] dark:text-slate-400">
              No repair requests received yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F7F9FC] dark:bg-[#0B1120] text-xs font-semibold text-[#68758A] dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3">Service</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Preferred Date</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {bookings.slice(0, 5).map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                      <td className="px-6 py-3.5 font-semibold text-[#172033] dark:text-white">
                        {b.serviceTitle}
                      </td>
                      <td className="px-6 py-3.5 text-[#68758A] dark:text-slate-300">
                        {b.customerName}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-xs tabular-nums text-[#68758A] dark:text-slate-400">
                        {b.preferredDate}
                      </td>
                      <td className="px-6 py-3.5 text-right font-bold tabular-nums">
                        ${b.finalAmount}
                      </td>
                      <td className="px-6 py-3.5">
                        <StatusBadge status={b.status} />
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
