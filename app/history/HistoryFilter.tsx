// app/history/HistoryFilter.tsx
'use client';

import { useState, useEffect } from 'react';

const API_BASE: string =
  (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:10000').replace(/\/$/, '');

type SortKey = 'latest' | 'oldest' | 'mostMatches';

interface Filters {
  dateFrom: string;
  dateTo: string;
  search: string;
  sort: SortKey;
}

type HistoryItem = any; // backend shape untouched
type Props = {
  onFilter: (data: HistoryItem[]) => void;
};

export default function HistoryFilter({ onFilter }: Props) {
  const [filters, setFilters] = useState<Filters>({
    dateFrom: '',
    dateTo: '',
    search: '',
    sort: 'latest',
  });

  // 🔁 Debounced filters (for ~300ms)
  const [debouncedFilters, setDebouncedFilters] = useState<Filters>(filters);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilters(filters), 300);
    return () => clearTimeout(t);
  }, [filters]);

  // 🔁 Auto-fetch once per combined (AND) filter set, after debounce
  useEffect(() => {
    const controller = new AbortController();

    const fetchFilteredHistory = async () => {
      const params = new URLSearchParams();
      if (debouncedFilters.dateFrom) params.append('dateFrom', debouncedFilters.dateFrom);
      if (debouncedFilters.dateTo) params.append('dateTo', debouncedFilters.dateTo);
      if (debouncedFilters.search) params.append('search', debouncedFilters.search);
      if (debouncedFilters.sort) params.append('sort', debouncedFilters.sort);

      try {
        const url = new URL(`${API_BASE}/history/user-history`);
        url.search = params.toString();

        const res = await fetch(url.toString(), {
          credentials: 'include',
          signal: controller.signal,
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(`HTTP ${res.status} ${txt}`);
        }

        const data: HistoryItem[] = await res.json();
        onFilter(data || []);
      } catch (error: any) {
        // ✅ Ignore AbortError (expected during rapid filter changes/unmount)
        if (error?.name === 'AbortError' || error?.code === 20) return;
        console.error('Failed to fetch filtered history:', error);
        onFilter([]); // keep previous behavior for real failures
      }
    };

    fetchFilteredHistory();
    return () => {
      controller.abort(); // cleanup without logging as error
    };
  }, [debouncedFilters, onFilter]);

  // Fully typed key/value (no implicit any)
  const handleFilterChange = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value } as Filters));
  };

  const handleClearFilters = () => {
    const clearedFilters: Filters = {
      dateFrom: '',
      dateTo: '',
      search: '',
      sort: 'latest',
    };
    setFilters(clearedFilters);
  };

  return (
    <div className="card p-6 mb-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">
            <span className="inline-flex items-center gap-2">
              <i className="ri-filter-3-line text-[hsl(var(--primary))]" />
              <span className="gradient-text">Filter &amp; Search History</span>
            </span>
          </h2>

        <button
            onClick={handleClearFilters}
            className="btn btn-ghost text-sm"
            aria-label="Clear all filters"
          >
            <i className="ri-refresh-line" />
            Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date From */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-muted-foreground" htmlFor="dateFrom">
              From Date
            </label>
            <div className="relative">
              <input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="input pr-11 bg-card"
                aria-label="From date"
              />
              <i className="ri-calendar-line absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {/* Date To */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-muted-foreground" htmlFor="dateTo">
              To Date
            </label>
            <div className="relative">
              <input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="input pr-11 bg-card"
                aria-label="To date"
              />
              <i className="ri-calendar-line absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-muted-foreground" htmlFor="searchPrompts">
              Search Prompts
            </label>
            <div className="relative">
              <input
                id="searchPrompts"
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="React, UI/UX, 5+ years..."
                className="input pr-11 bg-card"
                aria-label="Search prompts"
              />
              <i className="ri-search-line absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {/* Sort */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-muted-foreground" htmlFor="sortBy">
              Sort By
            </label>
            <div className="relative">
              <select
                id="sortBy"
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value as SortKey)}
                className="select appearance-none bg-card"
                aria-label="Sort history"
              >
                <option value="latest">Latest First</option>
                <option value="oldest">Oldest First</option>
                <option value="mostMatches">Most Matches</option>
              </select>
              <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Quick filters:</span>
          {['React', 'Python', 'UI/UX', '5+ years', 'full-stack'].map((tag) => (
            <button
              key={tag}
              onClick={() => handleFilterChange('search', tag)}
              className="btn btn-secondary !px-3 !py-1.5 text-xs"
              aria-label={`Quick filter ${tag}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
