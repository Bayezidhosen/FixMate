import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout.tsx';
import { StatusBadge } from '../../components/StatusBadge.tsx';
import type { BookingItem } from '../../shared/types.ts';

const BOOKING_FILTERS = [
  'all',
  'requested',
  'accepted',
  'in-progress',
  'completed',
  'rejected',
  'cancelled',
];

export function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/bookings?status=${encodeURIComponent(statusFilter)}`, {
          credentials: 'include',
        });
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
  }, [statusFilter]);

  return (
    <DashboardLayout allowedRoles={['admin']} title="Monitor All Bookings">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-2">
          {BOOKING_FILTERS.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-[#3867FF] text-white'
                  : 'text-[#68758A] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-6 text-sm text-[#68758A]">Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#68758A] dark:text-slate-400">
              No bookings match this filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F7F9FC] dark:bg-[#0B1120] text-xs font-semibold text-[#68758A] dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3">Service</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Technician</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                    <th className="px-6 py-3">Job Status</th>
                    <th className="px-6 py-3">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {bookings.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                      <td className="px-6 py-3.5 font-semibold text-[#172033] dark:text-white">
                        {b.serviceTitle}
                      </td>
                      <td className="px-6 py-3.5 text-[#68758A] dark:text-slate-300">
                        {b.customerName}
                      </td>
                      <td className="px-6 py-3.5 text-[#68758A] dark:text-slate-300">
                        {b.technicianName}
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
