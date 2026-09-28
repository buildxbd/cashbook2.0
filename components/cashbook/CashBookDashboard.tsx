'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BookSelector, BookItem } from './BookSelector';
import { BalanceSummaryHeader } from './BalanceSummaryHeader';
import { FilterBar } from './FilterBar';
import { TransactionList, TransactionRecord } from './TransactionList';
import { AddTransactionModal } from './AddTransactionModal';
import { EditTransactionModal } from './EditTransactionModal';
import { StaffManagementModal } from './StaffManagementModal';
import { AuditLogViewer } from './AuditLogViewer';
import { VoucherGalleryModal } from './VoucherGalleryModal';
import { PrintReceiptSlip } from './PrintReceiptSlip';
import { ReportsExportView } from './ReportsExportView';
import { NetworkBanner, PendingQueueBadge } from '@/components/ui/NetworkBanner';
import { PWAInstallPrompt } from '@/components/ui/PWAInstallPrompt';
import { syncEngine } from '@/lib/offline/sync-engine';
import { BalanceSummary } from '@/lib/services/ledger-service';
import { PaymentMode, TransactionType, Role } from '@prisma/client';
import { DEMO_USERS, UserSession } from '@/lib/auth/permissions';
import {
  RefreshCw,
  Layers,
  Users,
  History,
  Shield,
  Crown,
  Briefcase,
  Eye,
  AlertCircle,
  BarChart3,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';

interface CashBookDashboardProps {
  initialBookId?: string;
}

export function CashBookDashboard({ initialBookId }: CashBookDashboardProps) {
  // Current Active User (RBAC Simulation Context)
  const [currentUser, setCurrentUser] = useState<UserSession>(DEMO_USERS[0]); // Default to Owner

  // Active View Tab: 'LEDGER' | 'REPORTS'
  const [activeTab, setActiveTab] = useState<'LEDGER' | 'REPORTS'>('LEDGER');

  const [books, setBooks] = useState<BookItem[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>(initialBookId || '');
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [summary, setSummary] = useState<BalanceSummary>({
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
    transactionCount: 0,
    virtualWalletBalance: 85000,
    dailySpent: 4500,
    dailyLimit: 30000,
  });

  const [isLoadingBooks, setIsLoadingBooks] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionAlert, setActionAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isVoucherGalleryOpen, setIsVoucherGalleryOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionRecord | null>(null);
  const [printingTransaction, setPrintingTransaction] = useState<TransactionRecord | null>(null);

  // Filter States
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | TransactionType>('ALL');
  const [paymentModeFilter, setPaymentModeFilter] = useState<'ALL' | PaymentMode>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Load Books
  const loadBooks = useCallback(async () => {
    try {
      setIsLoadingBooks(true);
      const res = await fetch('/api/books');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setBooks(data.data);
        if (!selectedBookId && data.data.length > 0) {
          setSelectedBookId(data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load books:', err);
    } finally {
      setIsLoadingBooks(false);
    }
  }, [selectedBookId]);

  // Load Transactions & Balance Summary
  const loadTransactions = useCallback(async () => {
    if (!selectedBookId) return;
    try {
      setIsLoadingTransactions(true);
      const params = new URLSearchParams({ bookId: selectedBookId });
      const res = await fetch(`/api/transactions?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.data || []);
        // Cache to IndexedDB for offline access
        if (Array.isArray(data.data)) {
          syncEngine.cacheTransactions(data.data);
        }
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch (err) {
      console.warn('Failed to load online transactions, attempting IndexedDB cache:', err);
      // Fallback to IndexedDB cache
      const cached = await syncEngine.getCachedTransactions(selectedBookId);
      if (cached && cached.length > 0) {
        setTransactions(cached as unknown as TransactionRecord[]);
      }
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [selectedBookId]);

  // Subscribe to background sync completion to refresh state
  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((syncStatus) => {
      if (syncStatus.isOnline && !syncStatus.isSyncing && syncStatus.lastSyncedAt) {
        loadTransactions();
      }
    });
    return () => unsubscribe();
  }, [loadTransactions]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  useEffect(() => {
    if (selectedBookId) {
      loadTransactions();
    }
  }, [selectedBookId, loadTransactions]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadBooks(), loadTransactions()]);
    setIsRefreshing(false);
  };

  // Create Book
  const handleCreateBook = async (name: string, description: string) => {
    const res = await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to create ledger');
    }
    await loadBooks();
    if (data.data?.id) {
      setSelectedBookId(data.data.id);
    }
  };

  // Create Transaction (Offline-first with IndexedDB sync queue)
  const handleCreateTransaction = async (txData: {
    type: TransactionType;
    paymentMode: PaymentMode;
    amount: number;
    category: string;
    note?: string;
    voucherUrl?: string;
    locationGeo?: string;
    transactionDate?: string;
  }) => {
    // Check if offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const queueItem = await syncEngine.enqueueTransaction({
        ...txData,
        bookId: selectedBookId,
        performedBy: currentUser,
      });

      const optimisticTx: TransactionRecord = {
        id: queueItem.localId,
        bookId: selectedBookId,
        type: txData.type,
        paymentMode: txData.paymentMode,
        amount: txData.amount,
        category: txData.category,
        note: txData.note,
        voucherUrl: txData.voucherUrl,
        locationGeo: txData.locationGeo,
        transactionDate: txData.transactionDate || new Date().toISOString(),
        isLocked: false,
        createdById: currentUser.id,
      };

      setTransactions((prev) => [optimisticTx, ...prev]);
      setSummary((prev) => ({
        ...prev,
        totalIncome: txData.type === 'INCOME' ? prev.totalIncome + txData.amount : prev.totalIncome,
        totalExpense: txData.type === 'EXPENSE' ? prev.totalExpense + txData.amount : prev.totalExpense,
        netBalance: txData.type === 'INCOME' ? prev.netBalance + txData.amount : prev.netBalance - txData.amount,
        transactionCount: prev.transactionCount + 1,
      }));

      setActionAlert({
        message: '🔴 Offline Mode: Transaction saved locally in IndexedDB and will auto-sync when reconnected.',
        type: 'success',
      });
      setTimeout(() => setActionAlert(null), 5000);
      return;
    }

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...txData,
          bookId: selectedBookId,
          performedBy: currentUser,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to record transaction');
      }

      setActionAlert({ message: 'Transaction recorded and added to audit trail.', type: 'success' });
      setTimeout(() => setActionAlert(null), 4000);
      await loadTransactions();
    } catch (err) {
      // If network failure occurred during request, enqueue offline
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await syncEngine.enqueueTransaction({
          ...txData,
          bookId: selectedBookId,
          performedBy: currentUser,
        });
        setActionAlert({
          message: 'Connection dropped. Transaction queued locally for auto-sync.',
          type: 'success',
        });
        setTimeout(() => setActionAlert(null), 5000);
        return;
      }
      throw err;
    }
  };

  // Update Transaction
  const handleUpdateTransaction = async (updatedData: {
    id: string;
    amount: number;
    category: string;
    note?: string;
    voucherUrl?: string;
    locationGeo?: string;
  }) => {
    const res = await fetch('/api/transactions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...updatedData,
        performedBy: currentUser,
      }),
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to update transaction');
    }

    setActionAlert({ message: `Transaction #${updatedData.id.slice(-6)} updated successfully.`, type: 'success' });
    setTimeout(() => setActionAlert(null), 4000);
    await loadTransactions();
  };

  // Delete Transaction
  const handleDeleteTransaction = async (id: string) => {
    const params = new URLSearchParams({
      id,
      role: currentUser.role,
      userId: currentUser.id,
      userName: currentUser.name,
    });

    const res = await fetch(`/api/transactions?${params.toString()}`, {
      method: 'DELETE',
    });

    const data = await res.json();
    if (!data.success) {
      alert(data.error || 'Failed to delete transaction');
      return;
    }

    setActionAlert({ message: `Transaction #${id.slice(-6)} deleted and recorded to immutable audit log.`, type: 'success' });
    setTimeout(() => setActionAlert(null), 4000);
    await loadTransactions();
  };

  const handleOpenAddModal = (defaultType: 'INCOME' | 'EXPENSE') => {
    setModalDefaultType(defaultType);
    setIsAddModalOpen(true);
  };

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [transactions]);

  // Client filtering
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (typeFilter !== 'ALL' && t.type !== typeFilter) return false;
      if (paymentModeFilter !== 'ALL' && t.paymentMode !== paymentModeFilter) return false;
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const inNote = t.note?.toLowerCase().includes(query);
        const inCat = t.category.toLowerCase().includes(query);
        const inRrn = t.upiRefNumber?.includes(query);
        if (!inNote && !inCat && !inRrn) return false;
      }
      return true;
    });
  }, [transactions, typeFilter, paymentModeFilter, categoryFilter, search]);

  // Count vouchers
  const voucherCount = useMemo(() => {
    return transactions.filter((t) => t.voucherUrl && t.voucherUrl.trim().length > 0).length;
  }, [transactions]);

  // CSV Export
  const handleExportCsv = () => {
    if (filteredTransactions.length === 0) return;

    const headers = [
      'ID',
      'Date',
      'Type',
      'Amount (BDT)',
      'Category',
      'Payment Mode',
      'Note',
      'Voucher URL',
      'UPI RRN',
      'Running Balance',
    ];

    const rows = filteredTransactions.map((t) => [
      t.id,
      new Date(t.transactionDate).toISOString().split('T')[0],
      t.type,
      t.amount,
      `"${t.category.replace(/"/g, '""')}"`,
      t.paymentMode,
      `"${(t.note || '').replace(/"/g, '""')}"`,
      t.voucherUrl || '',
      t.upiRefNumber || '',
      t.runningBalance !== undefined ? t.runningBalance : '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cashbook_${selectedBookId}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('ALL');
    setPaymentModeFilter('ALL');
    setCategoryFilter('ALL');
  };

  const currentBook = books.find((b) => b.id === selectedBookId);

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="w-3.5 h-3.5 text-amber-400" />;
      case 'FINANCE_MANAGER':
        return <Shield className="w-3.5 h-3.5 text-emerald-400" />;
      case 'DATA_OPERATOR':
        return <Briefcase className="w-3.5 h-3.5 text-sky-400" />;
      case 'VIEWER':
      default:
        return <Eye className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16 selection:bg-emerald-500 selection:text-white">
      {/* Network Connectivity & Offline Queue Banner */}
      <NetworkBanner />

      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  CashBook <span className="text-emerald-400">2.0</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  BuildX Enterprise
                </span>
                <PendingQueueBadge />
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Multi-Ledger CashBook & UPI/MFS Native Expense Platform
              </p>
            </div>
          </div>

          {/* Right Header Navigation & Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Vouchers Gallery Button */}
            <button
              onClick={() => setIsVoucherGalleryOpen(true)}
              title="View Attached Receipt Vouchers"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors"
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline">Vouchers</span>
              {voucherCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300">
                  {voucherCount}
                </span>
              )}
            </button>

            {/* Staff & Roles Button */}
            <button
              onClick={() => setIsStaffModalOpen(true)}
              title="Staff & Role Management"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden lg:inline">Staff</span>
            </button>

            {/* Audit Trail Button */}
            <button
              onClick={() => setIsAuditModalOpen(true)}
              title="Immutable Audit Trail"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors"
            >
              <History className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline">Audit</span>
            </button>

            {/* RBAC Role Switcher */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-xl p-1 text-xs">
              <div className="flex items-center gap-1 px-1">
                {getRoleIcon(currentUser.role)}
              </div>
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const found = DEMO_USERS.find((u) => u.id === e.target.value);
                  if (found) setCurrentUser(found);
                }}
                className="bg-slate-950 text-slate-200 text-xs font-semibold rounded-lg px-2 py-1 border border-slate-800 focus:outline-none focus:border-emerald-500 max-w-[130px] sm:max-w-none truncate"
              >
                {DEMO_USERS.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Book Selector */}
            <BookSelector
              books={books}
              selectedBookId={selectedBookId}
              onSelectBook={setSelectedBookId}
              onCreateBook={handleCreateBook}
              isLoading={isLoadingBooks}
            />

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh ledger data"
              className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Action Alert Banner */}
        {actionAlert && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 rounded-xl flex items-center gap-2.5 text-xs animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionAlert.message}</span>
          </div>
        )}

        {/* Navigation Tabs (Ledger Entries vs Reports & Analytics) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('LEDGER')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'LEDGER'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CashBook Ledger</span>
            </button>

            <button
              onClick={() => setActiveTab('REPORTS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'REPORTS'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Reports & PDF/Excel Export</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Operating as: <strong className="text-emerald-400">{currentUser.name}</strong></span>
            <span className="font-mono text-slate-500">[{currentUser.role}]</span>
          </div>
        </div>

        {/* Tab 1: Live Ledger Entries */}
        {activeTab === 'LEDGER' ? (
          <>
            {/* Real-time Balance Summary & Action Buttons */}
            <BalanceSummaryHeader
              summary={summary}
              onOpenAddModal={handleOpenAddModal}
              currentUserRole={currentUser.role}
              currency="BDT"
            />

            {/* Filter & Search Bar */}
            <FilterBar
              search={search}
              onSearchChange={setSearch}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
              paymentModeFilter={paymentModeFilter}
              onPaymentModeFilterChange={setPaymentModeFilter}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              categories={categories}
              onResetFilters={handleResetFilters}
              onExportCsv={handleExportCsv}
              totalFilteredCount={filteredTransactions.length}
            />

            {/* Transaction Table / List */}
            <TransactionList
              transactions={filteredTransactions}
              onOpenAddModal={handleOpenAddModal}
              onEditTransaction={(tx) => setEditingTransaction(tx)}
              onDeleteTransaction={handleDeleteTransaction}
              onPrintSlip={(tx) => setPrintingTransaction(tx)}
              currentUser={currentUser}
              currency="BDT"
              isLoading={isLoadingTransactions}
            />
          </>
        ) : (
          /* Tab 2: Reports & Analytics / PDF / Excel Exports */
          <ReportsExportView
            bookId={selectedBookId}
            bookName={currentBook?.name || 'Ledger'}
            onOpenVoucherGallery={() => setIsVoucherGalleryOpen(true)}
            currency="BDT"
          />
        )}
      </main>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateTransaction}
        defaultType={modalDefaultType}
        walletBalance={summary.virtualWalletBalance}
        dailyRemainingLimit={Math.max(0, summary.dailyLimit - summary.dailySpent)}
      />

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        transaction={editingTransaction}
        onSave={handleUpdateTransaction}
        currentUser={currentUser}
      />

      {/* Staff Management Modal */}
      <StaffManagementModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        currentUser={currentUser}
      />

      {/* Audit Log Viewer Modal */}
      <AuditLogViewer
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        currentUser={currentUser}
      />

      {/* Voucher Gallery Lightbox Modal */}
      <VoucherGalleryModal
        isOpen={isVoucherGalleryOpen}
        onClose={() => setIsVoucherGalleryOpen(false)}
        transactions={transactions}
        bookName={currentBook?.name || 'Current Ledger'}
      />

      {/* Print Receipt Memo Slip */}
      <PrintReceiptSlip
        isOpen={!!printingTransaction}
        onClose={() => setPrintingTransaction(null)}
        transaction={printingTransaction}
        businessName="BuildX Technologies Ltd."
        bookName={currentBook?.name || 'Main Cash Book'}
      />

      {/* PWA Standalone Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}
