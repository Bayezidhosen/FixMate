import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { SERVICE_CATEGORIES, SERVICE_MODES, type ServiceItem } from '../shared/types.ts';
import { ServiceCard } from '../components/ServiceCard.tsx';
import { ServiceSkeleton } from '../components/ServiceSkeleton.tsx';

export function ServicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSearch = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || 'All';
  const urlMode = searchParams.get('mode') || 'All';
  const urlSort = searchParams.get('sort') || 'newest';
  const urlPage = Math.max(1, Number(searchParams.get('page')) || 1);

  const [searchInput, setSearchInput] = useState(urlSearch);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    let active = true;
    async function fetchServices() {
      setLoading(true);
      setError('');
      try {
        const qs = new URLSearchParams();
        if (urlSearch) qs.set('search', urlSearch);
        if (urlCategory && urlCategory !== 'All') qs.set('category', urlCategory);
        if (urlMode && urlMode !== 'All') qs.set('mode', urlMode);
        qs.set('sort', urlSort);
        qs.set('page', String(urlPage));
        qs.set('limit', '9');

        const res = await fetch(`/api/services?${qs.toString()}`);
        if (!res.ok) {
          throw new Error('Failed to load repair services.');
        }
        const data = await res.json();
        if (active) {
          setServices(data.services || []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
        }
      } catch (err: any) {
        if (active) setError(err?.message || 'Unable to load services.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void fetchServices();
    return () => {
      active = false;
    };
  }, [urlSearch, urlCategory, urlMode, urlSort, urlPage]);

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, val] of Object.entries(updates)) {
      if (!val || val === 'All' || (key === 'page' && val === '1')) {
        next.delete(key);
      } else {
        next.set(key, val);
      }
    }
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ search: searchInput.trim() || null, page: '1' });
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  return (
    <div className="min-h-[80vh] bg-[#F7F9FC] dark:bg-[#0B1120] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#3867FF] dark:text-[#22D3EE] mb-1">
              FixMate Catalog
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#101B35] dark:text-white tracking-tight">
              Browse Repair Services
            </h1>
          </div>
          <p className="text-sm text-[#68758A] dark:text-slate-400 tabular-nums">
            Showing {services.length} of {total} verified services
          </p>
        </div>

        {/* Search, Filter & Sort Controls (All synced with URL query parameters & MongoDB server query) */}
        <div className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <form onSubmit={handleSearchSubmit} className="md:col-span-5 flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#68758A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by service title or category..."
                  aria-label="Search services"
                  className="w-full h-10 pl-10 pr-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm text-[#172033] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3867FF]"
                />
              </div>
              <button
                type="submit"
                className="h-10 px-4 rounded-lg bg-[#3867FF] hover:bg-[#2B54DB] text-white text-sm font-semibold transition-colors whitespace-nowrap"
              >
                Search
              </button>
            </form>

            <div className="md:col-span-3">
              <select
                value={urlCategory}
                onChange={(e) => updateParams({ category: e.target.value, page: '1' })}
                aria-label="Filter by category"
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm text-[#172033] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3867FF]"
              >
                <option value="All">All Categories</option>
                {SERVICE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                value={urlMode}
                onChange={(e) => updateParams({ mode: e.target.value, page: '1' })}
                aria-label="Filter by service mode"
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm text-[#172033] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3867FF]"
              >
                <option value="All">All Modes</option>
                {SERVICE_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                value={urlSort}
                onChange={(e) => updateParams({ sort: e.target.value, page: '1' })}
                aria-label="Sort services"
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm text-[#172033] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3867FF]"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Quick Category Segmented Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#68758A] dark:text-slate-400 mr-1">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Category:</span>
              </span>
              {['All', ...SERVICE_CATEGORIES].map((cat) => {
                const active = urlCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => updateParams({ category: cat, page: '1' })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[#101B35] text-white dark:bg-[#3867FF]'
                        : 'bg-slate-100 dark:bg-slate-800 text-[#68758A] dark:text-slate-300 hover:text-[#101B35] dark:hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {(urlSearch || urlCategory !== 'All' || urlMode !== 'All' || urlSort !== 'newest') && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3867FF] dark:text-[#22D3EE] hover:underline whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <ServiceSkeleton count={6} />
        ) : error ? (
          <div className="bg-white dark:bg-[#151E30] border border-rose-200 dark:border-rose-900 rounded-xl p-8 text-center">
            <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>
          </div>
        ) : services.length === 0 ? (
          <div className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center space-y-4">
            <h2 className="text-lg font-bold text-[#101B35] dark:text-white">
              No matching repair services found
            </h2>
            <p className="text-sm text-[#68758A] dark:text-slate-400 max-w-md mx-auto">
              Try adjusting your search keywords, switching service mode, or resetting category filters.
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="px-5 py-2.5 rounded-lg bg-[#3867FF] text-white text-sm font-semibold hover:bg-[#2B54DB] transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((svc) => (
                <ServiceCard key={svc._id} service={svc} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  type="button"
                  disabled={urlPage <= 1}
                  onClick={() => updateParams({ page: String(urlPage - 1) })}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#151E30] text-sm font-semibold disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                <span className="px-4 text-sm font-medium text-[#68758A] dark:text-slate-300 tabular-nums">
                  Page {urlPage} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={urlPage >= totalPages}
                  onClick={() => updateParams({ page: String(urlPage + 1) })}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#151E30] text-sm font-semibold disabled:opacity-40"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
