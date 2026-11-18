import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout.tsx';
import { StatusBadge } from '../../components/StatusBadge.tsx';
import type { PaymentItem } from '../../shared/types.ts';

export function CustomerPaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch('/api/payments/my', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (active) setPayments(data.payments || []);
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

  return (
    <DashboardLayout allowedRoles={['customer']} title="Payment History">
      <div className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-[#101B35] dark:text-white">
            Completed Transactions
          </h2>
          <span className="text-xs text-[#68758A] dark:text-slate-400 tabular-nums">
            {payments.length} records
          </span>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-[#68758A]">Loading payment history...</div>
        ) : payments.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#68758A] dark:text-slate-400">
            No completed payments recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F7F9FC] dark:bg-[#0B1120] text-xs font-semibold text-[#68758A] dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3">Service</th>
                  <th className="px-6 py-3">Technician</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3">Transaction ID</th>
                  <th className="px-6 py-3">Payment Date</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-3.5 font-semibold text-[#172033] dark:text-white">
                      {p.serviceTitle}
                    </td>
                    <td className="px-6 py-3.5 text-[#68758A] dark:text-slate-300">
                      {p.technicianName}
                    </td>
                    <td className="px-6 py-3.5 text-right font-bold tabular-nums">
                      ${p.amount.toFixed(2)} {p.currency}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs text-[#68758A] dark:text-slate-400">
                      {p.transactionId}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs text-[#68758A] dark:text-slate-400 tabular-nums">
                      {new Date(p.paidAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={p.paymentStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
