import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Check, X, Play, CheckCircle2 } from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout.tsx';
import { StatusBadge } from '../../components/StatusBadge.tsx';
import type { BookingItem, BookingStatus } from '../../shared/types.ts';

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'requested', label: 'Requested' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function TechnicianRequestsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Completion modal state
  const [completingBooking, setCompletingBooking] = useState<BookingItem | null>(null);
  const [finalAmountInput, setFinalAmountInput] = useState('');

  const loadBookings = async (filter: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/technician?status=${encodeURIComponent(filter)}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBookings(statusFilter);
  }, [statusFilter]);

  const updateStatus = async (
    bookingId: string,
    nextStatus: BookingStatus,
    finalAmount?: number
  ) => {
    setBusyId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: nextStatus, finalAmount }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Could not update job status.');
        return;
      }
      toast.success(`Job marked as ${nextStatus}.`);
      setCompletingBooking(null);
      void loadBookings(statusFilter);
    } catch {
      toast.error('Network error updating job status.');
    } finally {
      setBusyId(null);
    }
  };

  const openCompleteModal = (b: BookingItem) => {
    setCompletingBooking(b);
    setFinalAmountInput(String(b.basePrice));
  };

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingBooking) return;
    const amt = Number(finalAmountInput);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error('Final amount must be a number greater than zero.');
      return;
    }
    void updateStatus(completingBooking._id, 'completed', amt);
  };

  return (
    <DashboardLayout allowedRoles={['technician']} title="Manage Repair Requests">
      <div className="space-y-6">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                statusFilter === f.value
                  ? 'bg-[#3867FF] text-white'
                  : 'text-[#68758A] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-sm text-[#68758A]">
            Loading repair requests...
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-sm text-[#68758A] dark:text-slate-400">
            No repair requests match this status filter.
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => {
              const isBusy = busyId === b._id;
              return (
                <div
                  key={b._id}
                  className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#68758A] dark:text-slate-400">
                      <span className="font-semibold text-[#3867FF] dark:text-[#22D3EE]">
                        {b.category}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">Date: {b.preferredDate}</span>
                      <span aria-hidden="true">·</span>
                      <span>Customer: {b.customerName} ({b.customerPhone})</span>
                    </div>
                    <h3 className="text-base font-bold text-[#101B35] dark:text-white">
                      {b.serviceTitle}
                    </h3>
                    <p className="text-xs text-[#68758A] dark:text-slate-400">
                      Address: {b.address}
                    </p>
                    <p className="text-sm text-[#172033] dark:text-slate-200 pt-1">
                      {b.problemDescription}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-1.5">
                      <StatusBadge status={b.status} />
                      <StatusBadge status={b.paymentStatus} />
                      <span className="text-xs font-bold text-[#101B35] dark:text-white tabular-nums">
                        {b.status === 'completed' ? `Final: $${b.finalAmount}` : `Base: $${b.basePrice}`}
                      </span>
                    </div>
                  </div>

                  {/* Strict Job Pipeline Actions */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {b.status === 'requested' && (
                      <>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => updateStatus(b._id, 'accepted')}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3867FF] hover:bg-[#2B54DB] text-white text-xs font-semibold disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => updateStatus(b._id, 'rejected')}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}

                    {b.status === 'accepted' && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => updateStatus(b._id, 'in-progress')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#101B35] dark:bg-[#3867FF] text-white text-xs font-semibold disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Start Work</span>
                      </button>
                    )}

                    {b.status === 'in-progress' && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => openCompleteModal(b)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Completed</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completion Final Amount Modal */}
      {completingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#101B35] dark:text-white">
              Complete Repair &amp; Set Final Invoice
            </h2>
            <p className="text-xs text-[#68758A] dark:text-slate-400">
              Enter the final repair amount (USD) for &ldquo;{completingBooking.serviceTitle}&rdquo;. Base price was ${completingBooking.basePrice}.
            </p>
            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Final Amount (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={finalAmountInput}
                  onChange={(e) => setFinalAmountInput(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#3867FF]"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCompletingBooking(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busyId === completingBooking._id}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  {busyId === completingBooking._id ? 'Submitting...' : 'Confirm Completion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
