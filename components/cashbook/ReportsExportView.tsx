'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import {
  DateRangePreset,
  ReportAnalyticsSummary,
} from '@/lib/reports/report-types';
import { LedgerTransaction } from '@/lib/services/ledger-service';
import { downloadCashBookPdf } from '@/lib/reports/pdf-generator';
import { exportToExcel, exportToCsv } from '@/lib/reports/excel-export';
import { PaymentMode } from '@prisma/client';

interface ReportsExportViewProps {
  bookId: string;
  bookName: string;
  onOpenVoucherGallery: () => void;
  currency?: string;
}

const PRESET_OPTIONS: { label: string; value: DateRangePreset }[] = [
  { label: 'This Month', value: 'THIS_MONTH' },
  { label: 'This Week', value: 'THIS_WEEK' },
  { label: 'Today', value: 'TODAY' },
  { label: 'Yesterday', value: 'YESTERDAY' },
  { label: 'Last Month', value: 'LAST_MONTH' },
  { label: 'All Time', value: 'ALL_TIME' },
  { label: 'Custom Range', value: 'CUSTOM' },
];

export function ReportsExportView({
  bookId,
  bookName,
  onOpenVoucherGallery,
  currency = 'BDT',
}: ReportsExportViewProps) {
  const [preset, setPreset] = useState<DateRangePreset>('THIS_MONTH');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedMode, setSelectedMode] = useState<'ALL' | PaymentMode>('ALL');

  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<ReportAnalyticsSummary | null>(null);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);

  const fetchReportData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        bookId,
        preset,
        category: selectedCategory,
        paymentMode: selectedMode,
        ...(customStart ? { startDate: customStart } : {}),
        ...(customEnd ? { endDate: customEnd } : {}),
      });

      const res = await fetch(`/api/reports?${params.toString()}`);
      const result = await res.json();
      if (result.success && result.data) {
        setSummary(result.data.summary);
        setTransactions(result.data.transactions);
      }
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setIsLoading(false);
    }
  }, [bookId, preset, selectedCategory, selectedMode, customStart, customEnd]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleExportPdf = () => {
    if (!summary) return;
    downloadCashBookPdf({
      bookName,
      startDate: summary.startDate,
      endDate: summary.endDate,
      transactions,
      summary: {
        totalIncome: summary.totalIncome,
        totalExpense: summary.totalExpense,
        netBalance: summary.netBalance,
        transactionCount: summary.transactionCount,
      },
    });
  };

  const handleExportExcel = () => {
    if (!summary) return;
    exportToExcel({
      bookName,
      startDate: summary.startDate,
      endDate: summary.endDate,
      transactions,
      summary: {
        totalIncome: summary.totalIncome,
        totalExpense: summary.totalExpense,
        netBalance: summary.netBalance,
        transactionCount: summary.transactionCount,
      },
    });
  };

  const handleExportCsv = () => {
    if (!summary) return;
    exportToCsv({
      bookName,
      startDate: summary.startDate,
      endDate: summary.endDate,
      transactions,
      summary: {
        totalIncome: summary.totalIncome,
        totalExpense: summary.totalExpense,
        netBalance: summary.netBalance,
        transactionCount: summary.transactionCount,
      },
    });
  };

  const handleResetFilters = () => {
    setPreset('THIS_MONTH');
    setCustomStart('');
    setCustomEnd('');
    setSelectedCategory('ALL');
    setSelectedMode('ALL');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner with Action Buttons */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-100">
              Advanced Reports & Statement Engine
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Excel / PDF Ready
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Filter, aggregate, and export complete audit statements for <span className="text-slate-200">{bookName}</span>
          </p>
        </div>

        {/* Action Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenVoucherGallery}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Receipt className="w-3.5 h-3.5 text-emerald-400" />
            <span>Vouchers Gallery</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={!summary || summary.transactionCount === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={!summary || summary.transactionCount === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 disabled:opacity-40 rounded-xl text-xs font-semibold border border-emerald-500/30 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportPdf}
            disabled={!summary || summary.transactionCount === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Download PDF Statement</span>
          </button>
        </div>
      </div>

      {/* Filter Selector Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-slate-400 font-semibold mr-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Date Preset:
          </span>

          <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {PRESET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPreset(opt.value)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  preset === opt.value
                    ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {(preset !== 'THIS_MONTH' || selectedCategory !== 'ALL' || selectedMode !== 'ALL') && (
            <button
              onClick={handleResetFilters}
              title="Reset filters"
              className="ml-auto flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Custom Date Pickers & Category Filter */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-xs">
          {preset === 'CUSTOM' && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400">From:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-slate-400">To:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-slate-400 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-500" /> Mode:
            </span>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value as 'ALL' | PaymentMode)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Payment Channels</option>
              <option value="CASH">Cash</option>
              <option value="VIRTUAL_WALLET">Virtual Wallet / MFS</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </div>

          {summary && (
            <span className="ml-auto text-slate-400 font-mono text-[11px]">
              Active Window: {summary.startDate} to {summary.endDate} ({summary.transactionCount} records)
            </span>
          )}
        </div>
      </div>

      {/* Summary KPI Cards & Analytics */}
      {isLoading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Aggregating ledger statement analytics...</p>
        </div>
      ) : summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Cash In */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Cash In (Credit)</span>
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-emerald-400 tracking-tight">
              +৳{summary.totalIncome.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-500">
              {summary.incomeCount} incoming transactions
            </p>
          </div>

          {/* Total Cash Out */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Cash Out (Debit)</span>
              <ArrowUpRight className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-2xl font-black text-rose-400 tracking-tight">
              -৳{summary.totalExpense.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-500">
              {summary.expenseCount} expense transactions
            </p>
          </div>

          {/* Net Flow */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Net Period Cash Flow</span>
              <TrendingUp className="w-4 h-4 text-teal-400" />
            </div>
            <p
              className={`text-2xl font-black tracking-tight ${
                summary.netBalance >= 0 ? 'text-teal-400' : 'text-rose-400'
              }`}
            >
              ৳{summary.netBalance.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-500">
              {summary.netBalance >= 0 ? 'Net surplus' : 'Net deficit'} in period
            </p>
          </div>

          {/* Average Size */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Avg Entry Turnover</span>
              <Wallet className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-black text-indigo-300 tracking-tight">
              ৳{summary.averageTransaction.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-500">
              Mean value per recorded voucher
            </p>
          </div>
        </div>
      )}

      {/* Visual Breakdowns: Category & Payment Mode */}
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Category Distribution */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Category Turnover Breakdown
            </h3>

            {summary.categoryBreakdown.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No categories recorded</p>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {summary.categoryBreakdown.map((cat) => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-200">{cat.category}</span>
                      <span className="font-mono text-slate-400">
                        ৳{cat.totalAmount.toLocaleString()} ({cat.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          cat.type === 'INCOME' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.max(4, cat.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Mode Distribution */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Payment Channel Allocation
            </h3>

            {summary.paymentModeBreakdown.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No transactions recorded</p>
            ) : (
              <div className="space-y-3">
                {summary.paymentModeBreakdown.map((m) => (
                  <div key={m.paymentMode} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-200 capitalize">
                        {m.paymentMode.replace('_', ' ').toLowerCase()}
                      </span>
                      <span className="font-mono text-slate-400">
                        ৳{m.totalAmount.toLocaleString()} ({m.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          m.paymentMode === 'VIRTUAL_WALLET' || m.paymentMode === 'VIRTUAL_UPI'
                            ? 'bg-indigo-500'
                            : m.paymentMode === 'BANK_TRANSFER'
                            ? 'bg-sky-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.max(4, m.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}

                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>MFS/Virtual Wallet Share:</span>
                  <strong className="text-indigo-400">
                    ৳{summary.virtualWalletExpense.toLocaleString()} {currency}
                  </strong>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
