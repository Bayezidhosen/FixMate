import {
  Clock,
  CheckCircle2,
  XCircle,
  Wrench,
  Ban,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import type { ApprovalStatus, BookingStatus, PaymentStatus } from '../shared/types.ts';

type StatusValue = BookingStatus | ApprovalStatus | PaymentStatus;

const STATUS_MAP: Record<
  StatusValue,
  { label: string; colorClass: string; Icon: typeof Clock }
> = {
  requested: {
    label: 'Requested',
    colorClass: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/50 dark:border-amber-800/60',
    Icon: Clock,
  },
  accepted: {
    label: 'Accepted',
    colorClass: 'text-[#3867FF] bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950/50 dark:border-blue-800/60',
    Icon: CheckCircle2,
  },
  'in-progress': {
    label: 'In Progress',
    colorClass: 'text-cyan-700 bg-cyan-50 border-cyan-200 dark:text-cyan-300 dark:bg-cyan-950/50 dark:border-cyan-800/60',
    Icon: Wrench,
  },
  completed: {
    label: 'Completed',
    colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-800/60',
    Icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    colorClass: 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950/50 dark:border-rose-800/60',
    Icon: XCircle,
  },
  cancelled: {
    label: 'Cancelled',
    colorClass: 'text-slate-600 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-slate-800/70 dark:border-slate-700',
    Icon: Ban,
  },
  pending: {
    label: 'Pending Approval',
    colorClass: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/50 dark:border-amber-800/60',
    Icon: AlertCircle,
  },
  approved: {
    label: 'Approved',
    colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-800/60',
    Icon: CheckCircle2,
  },
  unpaid: {
    label: 'Unpaid',
    colorClass: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/50 dark:border-amber-800/60',
    Icon: CreditCard,
  },
  paid: {
    label: 'Paid',
    colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-800/60',
    Icon: CheckCircle2,
  },
};

export function StatusBadge({ status }: { status: StatusValue }) {
  const cfg = STATUS_MAP[status] || STATUS_MAP.pending;
  const { Icon } = cfg;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold whitespace-nowrap shrink-0 ${cfg.colorClass}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{cfg.label}</span>
    </span>
  );
}
