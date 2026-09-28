'use client';

import React, { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Building,
  Banknote,
  Receipt,
  Lock,
  Unlock,
  MapPin,
  ExternalLink,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { PaymentMode, TransactionType } from '@prisma/client';

export interface TransactionRecord {
  id: string;
  bookId: string;
  type: TransactionType;
  paymentMode: PaymentMode;
  amount: number;
  category: string;
  note?: string | null;
  voucherUrl?: string | null;
  locationGeo?: string | null;
  isLocked?: boolean;
  upiRefNumber?: string | null;
  transactionDate: string | Date;
  runningBalance?: number;
}

interface TransactionListProps {
  transactions: TransactionRecord[];
  onOpenAddModal: (type: 'INCOME' | 'EXPENSE') => void;
  currency?: string;
  isLoading?: boolean;
}

export function TransactionList({
  transactions,
  onOpenAddModal,
  currency = 'BDT',
  isLoading = false,
}: TransactionListProps) {
  const [selectedVoucher, setSelectedVoucher] = useState<string | null>(null);

  const getPaymentModeBadge = (mode: PaymentMode) => {
    switch (mode) {
      case 'VIRTUAL_WALLET':
      case 'VIRTUAL_UPI':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <Wallet className="w-3 h-3" /> Virtual Wallet
          </span>
        );
      case 'BANK_TRANSFER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <Building className="w-3 h-3" /> Bank
          </span>
        );
      case 'CASH':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Banknote className="w-3 h-3" /> Cash
          </span>
        );
    }
  };

  const formatDate = (dateInput: string | Date) => {
    const d = new Date(dateInput);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateInput: string | Date) => {
    const d = new Date(dateInput);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-400">Loading ledger transactions...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
          <FileSpreadsheet className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-200">No Transactions Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            No entries match your search criteria or this ledger is brand new. Record your first cash in or cash out below.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onOpenAddModal('INCOME')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
          >
            + Record Cash In
          </button>
          <button
            onClick={() => onOpenAddModal('EXPENSE')}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
          >
            - Record Cash Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden divide-y divide-slate-800/80">
        {/* Table Header (hidden on mobile) */}
        <div className="hidden md:grid grid-cols-12 px-5 py-3 bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <div className="col-span-2">Date & Time</div>
          <div className="col-span-4">Details & Category</div>
          <div className="col-span-2">Payment Mode</div>
          <div className="col-span-2 text-right">In / Out Amount</div>
          <div className="col-span-2 text-right">Running Balance</div>
        </div>

        {/* Transactions Rows */}
        <div className="divide-y divide-slate-800/50">
          {transactions.map((tx) => {
            const isIncome = tx.type === 'INCOME';

            return (
              <div
                key={tx.id}
                className="p-4 md:px-5 md:py-3.5 hover:bg-slate-800/40 transition-colors flex flex-col md:grid md:grid-cols-12 md:items-center gap-2 md:gap-0"
              >
                {/* Date & Time */}
                <div className="md:col-span-2 flex items-center justify-between md:block">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 md:hidden ${
                        isIncome
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-rose-500/15 text-rose-400'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">
                        {formatDate(tx.transactionDate)}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {formatTime(tx.transactionDate)}
                      </p>
                    </div>
                  </div>

                  {/* Mobile Amount & Badge */}
                  <div className="md:hidden text-right">
                    <span
                      className={`text-sm font-bold tracking-tight ${
                        isIncome ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'}৳{tx.amount.toLocaleString()}
                    </span>
                    {tx.runningBalance !== undefined && (
                      <p className="text-[10px] text-slate-400 font-mono">
                        Bal: ৳{tx.runningBalance.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Details & Category */}
                <div className="md:col-span-4 pr-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                      {tx.category}
                    </span>

                    {tx.isLocked ? (
                      <span
                        title="Reconciled & Locked"
                        className="text-amber-400 inline-flex items-center"
                      >
                        <Lock className="w-3 h-3" />
                      </span>
                    ) : (
                      <span title="Editable" className="text-slate-600 inline-flex items-center">
                        <Unlock className="w-3 h-3" />
                      </span>
                    )}

                    {tx.voucherUrl && (
                      <button
                        onClick={() => setSelectedVoucher(tx.voucherUrl ?? null)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        <Receipt className="w-3 h-3" />
                        <span>Voucher</span>
                      </button>
                    )}
                  </div>

                  {tx.note && (
                    <p className="text-xs text-slate-300 mt-1 font-normal line-clamp-1">
                      {tx.note}
                    </p>
                  )}

                  {tx.locationGeo && (
                    <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1 font-mono">
                      <MapPin className="w-2.5 h-2.5" />
                      {tx.locationGeo}
                      {tx.upiRefNumber && ` • RRN: ${tx.upiRefNumber}`}
                    </p>
                  )}
                </div>

                {/* Payment Mode */}
                <div className="md:col-span-2 my-1 md:my-0 flex items-center justify-between md:justify-start">
                  <span className="text-[11px] text-slate-400 md:hidden">Payment Mode:</span>
                  {getPaymentModeBadge(tx.paymentMode)}
                </div>

                {/* In / Out Amount (Desktop) */}
                <div className="hidden md:block md:col-span-2 text-right">
                  <span
                    className={`text-sm font-extrabold tracking-tight ${
                      isIncome ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isIncome ? '+' : '-'}৳{tx.amount.toLocaleString()}
                  </span>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    {isIncome ? 'Cash In' : 'Cash Out'}
                  </p>
                </div>

                {/* Running Balance (Desktop) */}
                <div className="hidden md:block md:col-span-2 text-right">
                  {tx.runningBalance !== undefined ? (
                    <span className="text-xs font-mono font-bold text-slate-200">
                      ৳{tx.runningBalance.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">-</span>
                  )}
                  <p className="text-[10px] text-slate-500">{currency}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Voucher Image Preview Modal */}
      {selectedVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-4 overflow-hidden shadow-2xl relative">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>Transaction Receipt / Voucher</span>
              </div>
              <button
                onClick={() => setSelectedVoucher(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedVoucher}
              alt="Receipt Voucher"
              className="w-full max-h-[70vh] object-contain rounded-xl bg-slate-950 border border-slate-800"
            />
            <div className="mt-3 flex justify-end">
              <a
                href={selectedVoucher}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Original in New Tab
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
