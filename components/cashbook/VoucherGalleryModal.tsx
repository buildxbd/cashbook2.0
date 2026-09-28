'use client';

import React, { useState } from 'react';
import {
  X,
  Receipt,
  ExternalLink,
  Search,
  ZoomIn,
  Image as ImageIcon,
} from 'lucide-react';
import { TransactionRecord } from './TransactionList';

interface VoucherGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: TransactionRecord[];
  bookName: string;
}

export function VoucherGalleryModal({
  isOpen,
  onClose,
  transactions,
  bookName,
}: VoucherGalleryModalProps) {
  const [search, setSearch] = useState('');
  const [selectedVoucher, setSelectedVoucher] = useState<TransactionRecord | null>(null);

  if (!isOpen) return null;

  // Filter only transactions with vouchers
  const voucherTransactions = transactions.filter(
    (t) => t.voucherUrl && t.voucherUrl.trim().length > 0
  );

  const filteredVouchers = voucherTransactions.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const inCat = t.category.toLowerCase().includes(q);
    const inNote = t.note?.toLowerCase().includes(q);
    const inAmt = t.amount.toString().includes(q);
    return inCat || inNote || inAmt;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">
                  Voucher & Receipt Gallery
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                  {filteredVouchers.length} Attachments
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Visual inspection of bills, receipts, and memos in <span className="text-slate-200">{bookName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search receipts by category, note, or amount..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            Total {voucherTransactions.length} receipts attached
          </span>
        </div>

        {/* Gallery Grid */}
        <div className="p-6 overflow-y-auto flex-1">
          {filteredVouchers.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500 mx-auto">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-300">No Receipts Found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {voucherTransactions.length === 0
                  ? 'No transactions in this ledger currently have voucher attachments. Attach images when recording cash entries.'
                  : 'No receipts match your search filter.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVouchers.map((tx) => {
                const isIncome = tx.type === 'INCOME';
                const dateFormatted = new Date(tx.transactionDate).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedVoucher(tx)}
                    className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden group hover:border-emerald-500/50 transition-all cursor-pointer shadow-md flex flex-col"
                  >
                    {/* Image Preview Container */}
                    <div className="h-44 w-full bg-slate-900 relative overflow-hidden flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={tx.voucherUrl ?? ''}
                        alt={tx.category}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 text-white text-xs font-semibold backdrop-blur-sm border border-slate-700">
                          <ZoomIn className="w-3.5 h-3.5" /> View Receipt
                        </span>
                      </div>
                      <span
                        className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          isIncome ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                        }`}
                      >
                        {isIncome ? '+' : '-'}৳{tx.amount.toLocaleString()}
                      </span>
                    </div>

                    {/* Metadata Card Footer */}
                    <div className="p-3 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200 truncate">
                          {tx.category}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {dateFormatted}
                        </span>
                      </div>
                      {tx.note && (
                        <p className="text-[11px] text-slate-400 line-clamp-1">
                          {tx.note}
                        </p>
                      )}
                      <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="capitalize">{tx.paymentMode.toLowerCase()}</span>
                        <span className="font-mono">#{tx.id.slice(-6)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/70 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>

      {/* Expanded Lightbox Modal */}
      {selectedVoucher && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 overflow-hidden shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-slate-200">
                  {selectedVoucher.category} Voucher (#{selectedVoucher.id.slice(-6)})
                </h4>
              </div>
              <button
                onClick={() => setSelectedVoucher(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedVoucher.voucherUrl ?? ''}
              alt="Receipt"
              className="w-full max-h-[60vh] object-contain rounded-xl bg-slate-950 border border-slate-800"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
              <div className="space-y-0.5">
                <p className="font-semibold text-slate-200">
                  Amount: <strong className="text-emerald-400">৳{selectedVoucher.amount.toLocaleString()} BDT</strong> ({selectedVoucher.type})
                </p>
                <p className="text-slate-400">
                  {selectedVoucher.note || 'No description provided'}
                </p>
              </div>

              <a
                href={selectedVoucher.voucherUrl ?? ''}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-colors shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open High-Res
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
