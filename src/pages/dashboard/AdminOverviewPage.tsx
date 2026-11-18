import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Users, Wrench, Clock, ClipboardList, DollarSign } from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout.tsx';

interface AdminStatsData {
  stats: {
    totalUsers: number;
    totalTechnicians: number;
    pendingServices: number;
    totalBookings: number;
    totalRevenue: number;
  };
  categoryChart: Array<{ category: string; bookings: number; revenue: number }>;
  statusChart: Array<{ status: string; count: number }>;
}

export function AdminOverviewPage() {
  const [data, setData] = useState<AdminStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch('/api/admin/stats', { credentials: 'include' });
        if (res.ok) {
          const d = await res.json();
          if (active) setData(d);
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

  const s = data?.stats;

  const cards = [
    { label: 'Total Users', value: s ? String(s.totalUsers) : '—', Icon: Users, color: 'text-[#3867FF]' },
    { label: 'Total Technicians', value: s ? String(s.totalTechnicians) : '—', Icon: Wrench, color: 'text-cyan-500' },
    { label: 'Pending Services', value: s ? String(s.pendingServices) : '—', Icon: Clock, color: 'text-amber-500' },
    { label: 'Total Bookings', value: s ? String(s.totalBookings) : '—', Icon: ClipboardList, color: 'text-indigo-500' },
    { label: 'Total Revenue', value: s ? `$${s.totalRevenue.toFixed(2)}` : '—', Icon: DollarSign, color: 'text-emerald-500' },
  ];

  return (
    <DashboardLayout allowedRoles={['admin']} title="Admin Overview">
      <div className="space-y-8">
        {/* 5 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {cards.map(({ label, value, Icon, color }) => (
            <div
              key={label}
              className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-start justify-between gap-2"
            >
              <div>
                <p className="text-xs font-semibold text-[#68758A] dark:text-slate-400">
                  {label}
                </p>
                <p className="text-2xl font-extrabold text-[#101B35] dark:text-white tabular-nums mt-1.5">
                  {loading ? '—' : value}
                </p>
              </div>
              <Icon className={`w-5 h-5 shrink-0 ${color}`} />
            </div>
          ))}
        </div>

        {/* Recharts Graphs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-[#101B35] dark:text-white">
                Bookings &amp; Revenue by Category
              </h2>
              <p className="text-xs text-[#68758A] dark:text-slate-400">
                Real-time distribution across the 7 FixMate repair categories
              </p>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.categoryChart || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                  <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#68758A' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#68758A' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#101B35',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="bookings" name="Bookings" fill="#3867FF" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="revenue" name="Revenue ($)" fill="#22D3EE" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-[#101B35] dark:text-white">
                Bookings by Status
              </h2>
              <p className="text-xs text-[#68758A] dark:text-slate-400">
                Current pipeline snapshot across all jobs
              </p>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.statusChart || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#68758A' }} />
                  <YAxis
                    dataKey="status"
                    type="category"
                    width={90}
                    tick={{ fontSize: 11, fill: '#68758A' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#101B35',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" name="Jobs" fill="#3867FF" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
