'use client';

import React from 'react';
import { Search, Filter, Download, RotateCcw } from 'lucide-react';
import { PaymentMode, TransactionType } from '@prisma/client';

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: 'ALL' | TransactionType;
  onTypeFilterChange: (type: 'ALL' | TransactionType) => void;
  paymentModeFilter: 'ALL' | PaymentMode;
  onPaymentModeFilterChange: (mode: 'ALL' | PaymentMode) => void;
  categoryFilter: string;
  onCategoryFilterChange: (cat: string) => void;
  categories: string[];
  onResetFilters: () => void;
  onExportCsv: () => void;
  totalFilteredCount: number;
}

export function FilterBar({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  paymentModeFilter,
  onPaymentModeFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  categories,
  onResetFilters,
  onExportCsv,
  totalFilteredCount,
}: FilterBarProps) {
  const hasActiveFilters =
    search ||
    typeFilter !== 'ALL' ||
    paymentModeFilter !== 'ALL' ||
    categoryFilter !== 'ALL';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search transactions by note, voucher, or category..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              title="Reset all filters"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          <button
            onClick={onExportCsv}
            disabled={totalFilteredCount === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-emerald-400 hover:text-emerald-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Selectors Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
        <span className="flex items-center gap-1 text-slate-400 font-medium mr-1">
          <Filter className="w-3.5 h-3.5 text-emerald-400" /> Filter:
        </span>

        {/* Type Filter */}
        <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800">
          {(['ALL', 'INCOME', 'EXPENSE'] as const).map((t) => (
            <button
              key={t}
              onClick={() => onTypeFilterChange(t)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                typeFilter === t
                  ? t === 'INCOME'
                    ? 'bg-emerald-600 text-white'
                    : t === 'EXPENSE'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === 'ALL' ? 'All Types' : t === 'INCOME' ? 'Cash In' : 'Cash Out'}
            </button>
          ))}
        </div>

        {/* Payment Mode Filter */}
        <select
          value={paymentModeFilter}
          onChange={(e) => onPaymentModeFilterChange(e.target.value as 'ALL' | PaymentMode)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 text-xs focus:outline-none focus:border-emerald-500"
        >
          <option value="ALL">All Payment Modes</option>
          <option value="CASH">Cash</option>
          <option value="VIRTUAL_WALLET">Virtual Wallet / MFS</option>
          <option value="BANK_TRANSFER">Bank Transfer</option>
        </select>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 text-xs focus:outline-none focus:border-emerald-500 max-w-[160px] truncate"
        >
          <option value="ALL">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <span className="ml-auto text-[11px] text-slate-500 font-mono">
          Showing {totalFilteredCount} records
        </span>
      </div>
    </div>
  );
}
