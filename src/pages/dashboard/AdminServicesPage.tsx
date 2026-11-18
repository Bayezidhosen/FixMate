import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout.tsx';
import { SafeImage } from '../../components/SafeImage.tsx';
import { StatusBadge } from '../../components/StatusBadge.tsx';
import type { ServiceItem } from '../../shared/types.ts';

export function AdminServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch('/api/admin/services', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (active) setServices(data.services || []);
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

  const handleApproval = async (id: string, approvalStatus: 'approved' | 'rejected') => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/services/${id}/approval`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ approvalStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Could not update approval.');
        return;
      }
      setServices((prev) =>
        prev
          .map((s) => (s._id === id ? data.service : s))
          .sort((a, b) => {
            if (a.approvalStatus === 'pending' && b.approvalStatus !== 'pending') return -1;
            if (a.approvalStatus !== 'pending' && b.approvalStatus === 'pending') return 1;
            return b.createdAt.localeCompare(a.createdAt);
          })
      );
      toast.success(`Service ${approvalStatus}.`);
    } catch {
      toast.error('Network error updating service approval.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <DashboardLayout allowedRoles={['admin']} title="Service Approval Queue">
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-sm text-[#68758A]">
            Loading services...
          </div>
        ) : services.length === 0 ? (
          <div className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center text-sm text-[#68758A]">
            No services submitted yet.
          </div>
        ) : (
          services.map((svc) => {
            const isBusy = busyId === svc._id;
            return (
              <div
                key={svc._id}
                className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between"
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-24 aspect-4/3 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 shrink-0">
                    <SafeImage
                      src={svc.image}
                      alt={svc.title}
                      fallbackLabel={svc.category}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#68758A] dark:text-slate-400">
                      <span className="font-semibold text-[#3867FF] dark:text-[#22D3EE]">
                        {svc.category}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{svc.serviceMode}</span>
                      <span aria-hidden="true">·</span>
                      <span>By {svc.technicianName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-bold text-[#101B35] dark:text-white tabular-nums">
                        ${svc.basePrice}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#101B35] dark:text-white">
                      {svc.title}
                    </h3>
                    <p className="text-xs text-[#68758A] dark:text-slate-400 line-clamp-2">
                      {svc.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <StatusBadge status={svc.approvalStatus} />
                  {svc.approvalStatus !== 'approved' && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleApproval(svc._id, 'approved')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  )}
                  {svc.approvalStatus !== 'rejected' && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleApproval(svc._id, 'rejected')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}
