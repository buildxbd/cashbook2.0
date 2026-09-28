'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Edit2,
  Lock,
  Unlock,
  AlertTriangle,
  Receipt,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { TransactionRecord } from './TransactionList';
import { Role } from '@prisma/client';
import { getTransactionLockInfo } from '@/lib/auth/permissions';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionRecord | null;
  onSave: (updatedData: {
    id: string;
    amount: number;
    category: string;
    note?: string;
    voucherUrl?: string;
    locationGeo?: string;
  }) => Promise<void>;
  currentUser: {
    id: string;
    name: string;
    role: Role;
  };
}

export function EditTransactionModal({
  isOpen,
  onClose,
  transaction,
  onSave,
  currentUser,
}: EditTransactionModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [voucherUrl, setVoucherUrl] = useState<string>('');
  const [locationGeo, setLocationGeo] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount.toString());
      setCategory(transaction.category || '');
      setNote(transaction.note || '');
      setVoucherUrl(transaction.voucherUrl || '');
      setLocationGeo(transaction.locationGeo || '');
      setErrorMsg(null);
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const lockInfo = getTransactionLockInfo(
    transaction.transactionDate,
    transaction.isLocked
  );

  const isOverrideActive =
    lockInfo.isLocked &&
    (currentUser.role === 'OWNER' || currentUser.role === 'FINANCE_MANAGER');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (!num || num <= 0) {
      setErrorMsg('Please enter a valid amount greater than 0');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await onSave({
        id: transaction.id,
        amount: num,
        category: category.trim(),
        note: note.trim(),
        voucherUrl: voucherUrl.trim(),
        locationGeo: locationGeo.trim(),
      });
      onClose();
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Edit Transaction #{transaction.id.slice(-6)}
              </h3>
              <p className="text-xs text-slate-400">
                Type: {transaction.type} • Mode: {transaction.paymentMode}
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

        {/* Lock Status Bar */}
        <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {lockInfo.isLocked ? (
              <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                <Lock className="w-3.5 h-3.5" /> {lockInfo.reason}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                <Unlock className="w-3.5 h-3.5" /> {lockInfo.reason}
              </span>
            )}
          </div>

          {isOverrideActive && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <ShieldCheck className="w-3 h-3" /> {currentUser.role} Override Active
            </span>
          )}
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-sm flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl flex items-start gap-2 text-xs text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Amount (BDT) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">
                ৳
              </span>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-lg font-bold text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Category <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Note / Description
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Voucher / Receipt Image URL
            </label>
            <div className="relative">
              <Receipt className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="url"
                value={voucherUrl}
                onChange={(e) => setVoucherUrl(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Location Coordinates
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={locationGeo}
                onChange={(e) => setLocationGeo(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !amount}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
            >
              {isSubmitting ? 'Saving Changes...' : 'Save & Audit Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
