export function ServiceSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-[#151E30] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-pulse"
        >
          <div className="aspect-4/3 bg-slate-200 dark:bg-slate-800" />
          <div className="p-5 space-y-3">
            <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-5 w-4/5 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
