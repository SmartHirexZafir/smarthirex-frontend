'use client';

import { useState, useEffect } from 'react';

const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:10000').replace(/\/$/, '');

export default function HistoryFilter({ onFilter }) {
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    search: '',
    sort: 'latest',
  });

  // 🔁 Automatically fetch filtered history on filter change
  useEffect(() => {
    const controller = new AbortController();

    const fetchFilteredHistory = async () => {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.search) params.append('search', filters.search);
      if (filters.sort) params.append('sort', filters.sort);

      try {
        const url = new URL(`${API_BASE}/history/user-history`);
        url.search = params.toString();

        const res = await fetch(url.toString(), {
          credentials: 'include', // send cookies/session if your API uses them
          signal: controller.signal,
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(`HTTP ${res.status} ${txt}`);
        }

        const data = await res.json();
        onFilter(data || []);
      } catch (error) {
        console.error('Failed to fetch filtered history:', error);
        onFilter([]);
      }
    };

    fetchFilteredHistory();
    return () => controller.abort();
  }, [filters]); // keep same behavior; only refetch on filter changes

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      dateFrom: '',
      dateTo: '',
      search: '',
      sort: 'latest',
    };
    setFilters(clearedFilters);
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 mb-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <i className="ri-filter-3-line mr-2 text-purple-600"></i>
            Filter & Search History
          </h2>
          <button
            onClick={handleClearFilters}
            className="text-gray-500 hover:text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors text-sm"
          >
            <i className="ri-refresh-line mr-1"></i>
            Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date From */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">From Date</label>
            <div className="relative">
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 bg-white/80 backdrop-blur-sm text-sm pr-10"
              />
              <i className="ri-calendar-line absolute right-3 top-3 text-gray-400"></i>
            </div>
          </div>

          {/* Date To */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">To Date</label>
            <div className="relative">
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 bg-white/80 backdrop-blur-sm text-sm pr-10"
              />
              <i className="ri-calendar-line absolute right-3 top-3 text-gray-400"></i>
            </div>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Search Prompts</label>
            <div className="relative">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="React, UI/UX, 5+ years..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 bg-white/80 backdrop-blur-sm text-sm pr-10"
              />
              <i className="ri-search-line absolute right-3 top-3 text-gray-400"></i>
            </div>
          </div>

          {/* Sort */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Sort By</label>
            <div className="relative">
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 bg-white/80 backdrop-blur-sm text-sm pr-10 appearance-none"
              >
                <option value="latest">Latest First</option>
                <option value="oldest">Oldest First</option>
                <option value="mostMatches">Most Matches</option>
              </select>
              <i className="ri-arrow-down-s-line absolute right-3 top-3 text-gray-400 pointer-events-none"></i>
            </div>
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 mr-2">Quick filters:</span>
          {['React', 'Python', 'UI/UX', '5+ years', 'full-stack'].map((tag) => (
            <button
              key={tag}
              onClick={() => handleFilterChange('search', tag)}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200 transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
