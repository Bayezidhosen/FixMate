import { Link } from 'react-router-dom';
import { ArrowRight, Clock, MapPin } from 'lucide-react';
import { SafeImage } from './SafeImage.tsx';
import type { ServiceItem } from '../shared/types.ts';

export function ServiceCard({ service }: { service: ServiceItem }) {
  return (
    <article className="flex flex-col h-full bg-white dark:bg-[#151E30] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-transform duration-150 hover:-translate-y-0.5">
      <div className="aspect-4/3 w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
        <SafeImage
          src={service.image}
          alt={service.title}
          fallbackLabel={service.category}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.03]"
        />
      </div>

      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center gap-2 text-xs font-medium text-[#68758A] dark:text-slate-400 mb-2">
          <span className="text-[#3867FF] dark:text-[#22D3EE] font-semibold">{service.category}</span>
          <span aria-hidden="true">·</span>
          <span>{service.serviceMode}</span>
        </div>

        <h3 className="text-base font-bold text-[#172033] dark:text-[#F8FAFC] leading-snug line-clamp-2 mb-2">
          {service.title}
        </h3>

        <p className="text-sm text-[#68758A] dark:text-slate-400 line-clamp-2 mb-4">
          {service.description}
        </p>

        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-[#68758A] dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-[#68758A]" />
              <span className="truncate">{service.technicianName}</span>
            </span>
            <span className="inline-flex items-center gap-1 shrink-0 tabular-nums">
              <Clock className="w-3.5 h-3.5" />
              <span>{service.estimatedDuration}</span>
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="block text-[11px] text-[#68758A] dark:text-slate-400">Starting at</span>
              <span className="text-lg font-extrabold text-[#101B35] dark:text-white tabular-nums">
                ${service.basePrice}
              </span>
            </div>

            <Link
              to={`/services/${service._id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#101B35] dark:bg-[#3867FF] text-white text-xs font-semibold hover:bg-[#3867FF] dark:hover:bg-[#2B54DB] transition-colors whitespace-nowrap shrink-0"
            >
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
