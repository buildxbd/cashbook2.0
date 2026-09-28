'use client';

import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  TrendingUp,
  Plus,
  Minus,
  ShieldCheck,
} from 'lucide-react';
import { BalanceSummary } from '@/lib/services/ledger-service';

import { Role } from '@prisma/client';
import { canAddTransaction } from '@/lib/auth/permissions';

interface BalanceSummaryHeaderProps {
  summary: BalanceSummary;
  onOpenAddModal: (defaultType: 'INCOME' | 'EXPENSE') => void;
  currentUserRole?: Role;
  currency?: string;
}

export function BalanceSummaryHeader({
  summary,
  onOpenAddModal,
  currentUserRole = 'OWNER',
  currency = 'BDT',
}: BalanceSummaryHeaderProps) {
  const isNetPositive = summary.netBalance >= 0;
  const isAuthorizedToAdd = canAddTransaction(currentUserRole);
  const dailySpentPercent = Math.min(
    100,
    Math.round((summary.dailySpent / (summary.dailyLimit || 1)) * 100)
  );

  return (
    <div className="space-y-4">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100">Ledger Overview</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3" /> Live Reconciled
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Multi-ledger balance & verified MFS/Virtual wallet limits
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        {isAuthorizedToAdd ? (
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => onOpenAddModal('INCOME')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>Cash In (+IN)</span>
            </button>
            <button
              onClick={() => onOpenAddModal('EXPENSE')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-rose-600/25 transition-all transform hover:-translate-y-0.5"
            >
              <Minus className="w-4 h-4" />
              <span>Cash Out (-OUT)</span>
            </button>
          </div>
        ) : (
          <div className="px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-400 italic">
            Read-only mode (Role: {currentUserRole})
          </div>
        )}
      </div>

      {/* 3 Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Cash In (Income) */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Cash In (Income)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">
              ৳{summary.totalIncome.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-slate-400">{currency}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            All validated client retainers & credit receipts
          </p>
        </div>

        {/* Total Cash Out (Expense) */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-rose-500/40 transition-all">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Cash Out (Expense)
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-400 tracking-tight">
              ৳{summary.totalExpense.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-slate-400">{currency}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Procurement, vendors, utility & petty cash expenses
          </p>
        </div>

        {/* Net Running Balance */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-teal-500/40 transition-all">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Net Running Balance
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isNetPositive ? 'bg-teal-500/15 text-teal-400' : 'bg-rose-500/15 text-rose-400'
            }`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              isNetPositive ? 'text-teal-400' : 'text-rose-400'
            }`}>
              ৳{summary.netBalance.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-slate-400">{currency}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {isNetPositive ? 'Net positive liquidity' : 'Ledger deficit alert'} • {summary.transactionCount} transactions
          </p>
        </div>
      </div>

      {/* Virtual Wallet Allowance Monitor Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">MFS / Virtual Wallet Limit</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 font-mono">
                bKash / Nagad Engine
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Available Balance: <strong className="text-slate-200">৳{summary.virtualWalletBalance.toLocaleString()}</strong> • Daily Cap: <strong className="text-slate-200">৳{summary.dailyLimit.toLocaleString()}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-64">
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                dailySpentPercent > 80 ? 'bg-rose-500' : dailySpentPercent > 50 ? 'bg-amber-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${dailySpentPercent}%` }}
            />
          </div>
          <span className="font-mono text-slate-300 text-[11px] shrink-0 font-medium">
            ৳{summary.dailySpent.toLocaleString()} ({dailySpentPercent}%)
          </span>
        </div>
      </div>
    </div>
  );
}
