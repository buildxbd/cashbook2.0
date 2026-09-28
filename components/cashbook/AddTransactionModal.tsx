'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Minus,
  Wallet,
  Receipt,
  MapPin,
  Calendar,
  AlertTriangle,
  Building,
  Banknote,
  ShieldCheck,
} from 'lucide-react';
import { PaymentMode, TransactionType } from '@prisma/client';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    type: TransactionType;
    paymentMode: PaymentMode;
    amount: number;
    category: string;
    note?: string;
    voucherUrl?: string;
    locationGeo?: string;
    transactionDate?: string;
  }) => Promise<void>;
  defaultType?: 'INCOME' | 'EXPENSE';
  walletBalance?: number;
  dailyRemainingLimit?: number;
}

const CATEGORIES_INCOME = [
  'Client Retainer',
  'Sales Receipt',
  'Project Funding',
  'Consulting Fee',
  'Service Income',
  'Refund/Reversal',
  'Other Income',
];

const CATEGORIES_EXPENSE = [
  'Office Supply',
  'Transport & Fuel',
  'Cloud Infrastructure',
  'Equipment Rental',
  'Salary & Bonus',
  'Utility & Electric',
  'Food & Snacks',
  'Vendor Payment',
  'Contractor Wage',
  'Miscellaneous',
];

export function AddTransactionModal({
  isOpen,
  onClose,
  onSubmit,
  defaultType = 'EXPENSE',
  walletBalance = 85000,
  dailyRemainingLimit = 25500,
}: AddTransactionModalProps) {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [voucherUrl, setVoucherUrl] = useState<string>('');
  const [locationGeo, setLocationGeo] = useState<string>('23.8103,90.4125');
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setType(defaultType);
    setCategory(defaultType === 'INCOME' ? CATEGORIES_INCOME[0] : CATEGORIES_EXPENSE[0]);
    setValidationError(null);
  }, [defaultType, isOpen]);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(newType === 'INCOME' ? CATEGORIES_INCOME[0] : CATEGORIES_EXPENSE[0]);
    setValidationError(null);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAmount(val);
    const num = Number(val);

    // Instant validation for Virtual Wallet
    if (paymentMode === 'VIRTUAL_WALLET' && type === 'EXPENSE' && num > 0) {
      if (num > walletBalance) {
        setValidationError(`Amount exceeds virtual wallet balance (Available: ৳${walletBalance.toLocaleString()})`);
        return;
      }
      if (num > dailyRemainingLimit) {
        setValidationError(`Amount exceeds daily spend allowance (Remaining: ৳${dailyRemainingLimit.toLocaleString()})`);
        return;
      }
    }
    setValidationError(null);
  };

  const handleCaptureLocation = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationGeo(`${pos.coords.latitude.toFixed(4)},${pos.coords.longitude.toFixed(4)}`);
        },
        () => {
          // fallback to default Dhaka coordinates
          setLocationGeo('23.8103,90.4125');
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setValidationError('Please enter a valid amount greater than 0');
      return;
    }

    if (!category) {
      setValidationError('Please select or specify a category');
      return;
    }

    try {
      setIsSubmitting(true);
      setValidationError(null);
      await onSubmit({
        type,
        paymentMode,
        amount: numAmount,
        category,
        note: note.trim(),
        voucherUrl: voucherUrl.trim(),
        locationGeo,
        transactionDate: new Date(transactionDate).toISOString(),
      });
      // Reset form
      setAmount('');
      setNote('');
      setVoucherUrl('');
      onClose();
    } catch (err) {
      setValidationError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentCategories = type === 'INCOME' ? CATEGORIES_INCOME : CATEGORIES_EXPENSE;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white ${
                type === 'INCOME' ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            >
              {type === 'INCOME' ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Record New Transaction
              </h3>
              <p className="text-xs text-slate-400">Cash In (Credit) or Cash Out (Debit) voucher</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-sm flex-1">
          {/* Income vs Expense Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleTypeChange('INCOME')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-xs tracking-wider uppercase transition-all ${
                type === 'INCOME'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plus className="w-4 h-4" />
              Cash In (Income)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('EXPENSE')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-xs tracking-wider uppercase transition-all ${
                type === 'EXPENSE'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Minus className="w-4 h-4" />
              Cash Out (Expense)
            </button>
          </div>

          {/* Amount Input */}
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
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
                className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xl font-bold text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Payment Mode Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Payment Mode <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode('CASH')}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  paymentMode === 'CASH'
                    ? 'bg-slate-800 border-emerald-500 text-emerald-400 font-bold'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('VIRTUAL_WALLET')}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all relative ${
                  paymentMode === 'VIRTUAL_WALLET'
                    ? 'bg-slate-800 border-indigo-500 text-indigo-400 font-bold'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span>Virtual Wallet</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('BANK_TRANSFER')}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  paymentMode === 'BANK_TRANSFER'
                    ? 'bg-slate-800 border-sky-500 text-sky-400 font-bold'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>Bank Transfer</span>
              </button>
            </div>

            {/* Virtual Wallet Active Notice */}
            {paymentMode === 'VIRTUAL_WALLET' && (
              <div className="mt-2.5 p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-200 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-indigo-300">
                    Mock UPI / MFS Engine Protected
                  </p>
                  <p className="text-[11px] text-indigo-200/80 mt-0.5">
                    Verified against available balance (৳{walletBalance.toLocaleString()}) and daily spend cap (৳{dailyRemainingLimit.toLocaleString()} remaining).
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Category <span className="text-rose-400">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs"
            >
              {currentCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Transaction Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Location Coordinates
              </label>
              <div className="relative flex">
                <input
                  type="text"
                  value={locationGeo}
                  onChange={(e) => setLocationGeo(e.target.value)}
                  placeholder="Lat, Long"
                  className="w-full pl-3 pr-8 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleCaptureLocation}
                  title="Detect GPS Location"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-400"
                >
                  <MapPin className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Note / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Note / Description
            </label>
            <input
              type="text"
              placeholder="e.g. Paid for taxi ride and site inspection"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Voucher Receipt URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Voucher / Receipt Attachment (Image URL)
            </label>
            <div className="relative">
              <Receipt className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="url"
                placeholder="https://... receipt image link or leave empty"
                value={voucherUrl}
                onChange={(e) => setVoucherUrl(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Validation Error Banner */}
          {validationError && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl flex items-start gap-2.5 text-xs text-rose-300 animate-in fade-in duration-150">
              <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !!validationError || !amount}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all ${
                type === 'INCOME'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting
                ? 'Saving Record...'
                : type === 'INCOME'
                ? 'Save Cash In (+)'
                : 'Save Cash Out (-)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
