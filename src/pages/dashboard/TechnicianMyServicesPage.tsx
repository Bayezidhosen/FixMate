import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Pencil, Trash2, PlusCircle, X } from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout.tsx';
import { SafeImage } from '../../components/SafeImage.tsx';
import { StatusBadge } from '../../components/StatusBadge.tsx';
import {
  SERVICE_CATEGORIES,
  SERVICE_MODES,
  type ServiceCategory,
  type ServiceItem,
  type ServiceMode,
} from '../../shared/types.ts';

export function TechnicianMyServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ServiceItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    title: '',
    category: 'Smartphone' as ServiceCategory,
    description: '',
    basePrice: 0,
    estimatedDuration: '',
    serviceMode: 'Home Visit' as ServiceMode,
    serviceArea: '',
  });

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch('/api/services/technician', { credentials: 'include' });
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

  const openEdit = (svc: ServiceItem) => {
    setEditing(svc);
    setEditForm({
      title: svc.title,
      category: svc.category,
      description: svc.description,
      basePrice: svc.basePrice,
      estimatedDuration: svc.estimatedDuration,
      serviceMode: svc.serviceMode,
      serviceArea: svc.serviceArea,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (editForm.basePrice <= 0) {
      toast.error('Base price must be greater than zero.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/services/${editing._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Could not update service.');
        return;
      }
      setServices((prev) => prev.map((s) => (s._id === editing._id ? data.service : s)));
      setEditing(null);
      toast.success('Service updated and re-queued for Admin approval.');
    } catch {
      toast.error('Network error updating service.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailability = async (svc: ServiceItem) => {
    try {
      const res = await fetch(`/api/services/${svc._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isAvailable: !svc.isAvailable }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to update availability.');
        return;
      }
      setServices((prev) => prev.map((s) => (s._id === svc._id ? data.service : s)));
      toast.success(
        data.service.isAvailable ? 'Service marked available.' : 'Service paused.'
      );
    } catch {
      toast.error('Network error toggling availability.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/services/${deleteTarget._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || 'Failed to delete service.');
        return;
      }
      setServices((prev) => prev.filter((s) => s._id !== deleteTarget._id));
      setDeleteTarget(null);
      toast.success('Service deleted.');
    } catch {
      toast.error('Network error deleting service.');
    }
  };

  return (
    <DashboardLayout allowedRoles={['technician']} title="My Services">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#68758A] dark:text-slate-400">
            Editing service details resets approval status to Pending for Admin review.
          </p>
          <Link
            to="/dashboard/technician/add-service"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3867FF] hover:bg-[#2B54DB] text-white text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Service</span>
          </Link>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-sm text-[#68758A]">
            Loading your services...
          </div>
        ) : services.length === 0 ? (
          <div className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center space-y-4">
            <h2 className="text-lg font-bold text-[#101B35] dark:text-white">
              No services listed yet
            </h2>
            <Link
              to="/dashboard/technician/add-service"
              className="inline-block px-5 py-2.5 rounded-lg bg-[#3867FF] text-white text-sm font-semibold"
            >
              Create Your First Service
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {services.map((svc) => (
              <div
                key={svc._id}
                className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between"
              >
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div className="w-24 aspect-4/3 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 shrink-0">
                    <SafeImage
                      src={svc.image}
                      alt={svc.title}
                      fallbackLabel={svc.category}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#68758A] dark:text-slate-400">
                      <span className="font-semibold text-[#3867FF] dark:text-[#22D3EE]">
                        {svc.category}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{svc.serviceMode}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-bold text-[#101B35] dark:text-white tabular-nums">
                        ${svc.basePrice}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#101B35] dark:text-white truncate">
                      {svc.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <StatusBadge status={svc.approvalStatus} />
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(svc)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-md border transition-colors ${
                          svc.isAvailable
                            ? 'border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:bg-emerald-950/40'
                            : 'border-slate-200 text-slate-600 bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:bg-slate-800'
                        }`}
                      >
                        {svc.isAvailable ? 'Available (Click to Pause)' : 'Paused (Click to Enable)'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(svc)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:border-[#3867FF]"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(svc)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#101B35] dark:text-white">Edit Service</h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-1.5 rounded-lg text-[#68758A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, category: e.target.value as ServiceCategory }))
                    }
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm"
                  >
                    {SERVICE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Mode</label>
                  <select
                    value={editForm.serviceMode}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, serviceMode: e.target.value as ServiceMode }))
                    }
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm"
                  >
                    {SERVICE_MODES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Price ($)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={editForm.basePrice}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, basePrice: Number(e.target.value) }))
                    }
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Duration</label>
                  <input
                    type="text"
                    required
                    value={editForm.estimatedDuration}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, estimatedDuration: e.target.value }))
                    }
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Area</label>
                  <input
                    type="text"
                    required
                    value={editForm.serviceArea}
                    onChange={(e) => setEditForm((f) => ({ ...f, serviceArea: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-[#3867FF] text-white text-xs font-semibold"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-bold text-[#101B35] dark:text-white">Delete Service?</h2>
            <p className="text-xs text-[#68758A] dark:text-slate-400">
              Are you sure you want to permanently remove &ldquo;{deleteTarget.title}&rdquo;?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
