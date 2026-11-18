import { useEffect, useState } from 'react';
import { DollarSign } from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout.tsx';
import type { PaymentItem } from '../../shared/types.ts';

export function AdminTransactionsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch('/api/admin/payments', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (active) {
            setPayments(data.payments || []);
            setTotalRevenue(data.totalRevenue || 0);
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

  return (
    <DashboardLayout allowedRoles={['admin']} title="Monitor Transactions">
      <div className="space-y-6">
        <div className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#68758A] dark:text-slate-400">
              Total Platform Revenue
            </p>
            <p className="text-3xl font-extrabold text-[#101B35] dark:text-white tabular-nums mt-1">
              ${totalRevenue.toFixed(2)}
            </p>
          </div>
          <DollarSign className="w-7 h-7 text-emerald-500" />
        </div>

        <div className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-6 text-sm text-[#68758A]">Loading transactions...</div>
          ) : payments.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#68758A] dark:text-slate-400">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F7F9FC] dark:bg-[#0B1120] text-xs font-semibold text-[#68758A] dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Technician</th>
                    <th className="px-6 py-3">Service</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                    <th className="px-6 py-3">Transaction ID</th>
                    <th className="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {payments.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                      <td className="px-6 py-3.5 font-medium text-[#172033] dark:text-white">
                        {p.customerName}
                      </td>
                      <td className="px-6 py-3.5 text-[#68758A] dark:text-slate-300">
                        {p.technicianName}
                      </td>
                      <td className="px-6 py-3.5 text-[#172033] dark:text-slate-200">
                        {p.serviceTitle}
                      </td>
                      <td className="px-6 py-3.5 text-right font-bold tabular-nums">
                        ${p.amount.toFixed(2)} {p.currency}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-xs text-[#68758A] dark:text-slate-400">
                        {p.transactionId}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-xs tabular-nums text-[#68758A] dark:text-slate-400">
                        {new Date(p.paidAt).toLocaleDateString()}
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
