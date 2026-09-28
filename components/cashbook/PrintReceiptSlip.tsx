'use client';

import React from 'react';
import { X, Printer, CheckCircle } from 'lucide-react';
import { TransactionRecord } from './TransactionList';

interface PrintReceiptSlipProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionRecord | null;
  businessName?: string;
  bookName?: string;
}

export function PrintReceiptSlip({
  isOpen,
  onClose,
  transaction,
  businessName = 'BuildX Technologies Ltd.',
  bookName = 'Main Cash Book',
}: PrintReceiptSlipProps) {
  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const isIncome = transaction.type === 'INCOME';
  const txDate = new Date(transaction.transactionDate);
  const dateStr = txDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = txDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 print:p-0 print:bg-white print:static">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden print:border-none print:shadow-none print:w-full print:max-w-none print:bg-white print:text-black">
        {/* Actions bar (hidden during print) */}
        <div className="px-6 py-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between print:hidden">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Transaction Voucher Memo
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Memo</span>
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Memo Layout */}
        <div className="p-8 space-y-6 bg-slate-950 text-slate-100 print:bg-white print:text-black print:p-6">
          {/* Header */}
          <div className="border-b-2 border-slate-800 print:border-black pb-4 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-black tracking-tight print:text-black">
                {businessName}
              </h2>
              <p className="text-xs text-slate-400 print:text-gray-600">
                Official CashBook Ledger: <strong className="text-slate-200 print:text-black">{bookName}</strong>
              </p>
              <p className="text-[11px] text-slate-500 print:text-gray-500 font-mono">
                BIN/GST: 192837465-BIN01 • Dhaka, Bangladesh
              </p>
            </div>
            <div className="text-right">
              <span
                className={`inline-block px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                  isIncome
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 print:bg-gray-100 print:text-black'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 print:bg-gray-100 print:text-black'
                }`}
              >
                {isIncome ? 'Credit / Cash In Memo' : 'Debit / Cash Out Voucher'}
              </span>
              <p className="text-[11px] text-slate-400 print:text-gray-600 font-mono mt-1">
                Ref: #{transaction.id}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 print:text-gray-500 uppercase tracking-wider text-[10px] font-bold block">
                Transaction Date & Time
              </span>
              <p className="font-semibold text-slate-200 print:text-black mt-0.5">
                {dateStr} at {timeStr}
              </p>
            </div>

            <div>
              <span className="text-slate-500 print:text-gray-500 uppercase tracking-wider text-[10px] font-bold block">
                Payment Channel
              </span>
              <p className="font-semibold text-slate-200 print:text-black mt-0.5 capitalize">
                {transaction.paymentMode.replace('_', ' ')}
                {transaction.upiRefNumber && ` (RRN: ${transaction.upiRefNumber})`}
              </p>
            </div>

            <div>
              <span className="text-slate-500 print:text-gray-500 uppercase tracking-wider text-[10px] font-bold block">
                Accounting Category
              </span>
              <p className="font-semibold text-slate-200 print:text-black mt-0.5">
                {transaction.category}
              </p>
            </div>

            <div>
              <span className="text-slate-500 print:text-gray-500 uppercase tracking-wider text-[10px] font-bold block">
                Location Coordinates
              </span>
              <p className="font-mono text-slate-300 print:text-black mt-0.5">
                {transaction.locationGeo || '23.8103,90.4125 (HQ)'}
              </p>
            </div>
          </div>

          {/* Amount Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 print:bg-gray-50 print:border-gray-300 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 print:text-gray-500">
                Amount Paid / Received
              </span>
              <p className="text-2xl font-black text-emerald-400 print:text-black mt-0.5 tracking-tight">
                ৳{transaction.amount.toLocaleString()} BDT
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 print:text-green-700 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" /> Reconciled & Approved
              </span>
            </div>
          </div>

          {/* Description */}
          {transaction.note && (
            <div className="text-xs">
              <span className="text-slate-500 print:text-gray-500 uppercase tracking-wider text-[10px] font-bold block mb-1">
                Particulars / Narration
              </span>
              <p className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-slate-300 print:bg-gray-50 print:border-gray-200 print:text-black">
                {transaction.note}
              </p>
            </div>
          )}

          {/* Signature Sign-Off Box */}
          <div className="pt-8 border-t border-slate-800 print:border-gray-300 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="border-b border-slate-700 print:border-black h-12 mb-2" />
              <p className="font-semibold text-slate-300 print:text-black">Prepared By (Staff)</p>
              <p className="text-[10px] text-slate-500 print:text-gray-500">CashBook Operator</p>
            </div>
            <div>
              <div className="border-b border-slate-700 print:border-black h-12 mb-2" />
              <p className="font-semibold text-slate-300 print:text-black">Authorized Signatory</p>
              <p className="text-[10px] text-slate-500 print:text-gray-500">Finance Manager / Owner</p>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-2 text-center text-[10px] text-slate-500 print:text-gray-400">
            This is a computer-generated voucher memo from CashBook 2.0 (cashbook.buildx.bd).
          </div>
        </div>
      </div>
    </div>
  );
}
