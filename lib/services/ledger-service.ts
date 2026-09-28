import { prisma } from '@/lib/prisma';
import { mockPaymentAdapter } from '@/lib/payment/mock-adapter';
import { PaymentMode, TransactionType, Role } from '@prisma/client';
import {
  canEditTransaction,
  canDeleteTransaction,
  isTransactionLockedByAge,
  canManageStaff,
} from '@/lib/auth/permissions';

export interface LedgerBook {
  id: string;
  name: string;
  description?: string | null;
  businessId: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    transactions: number;
  };
}

export interface LedgerTransaction {
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
  status?: string;
  walletId?: string | null;
  upiRefNumber?: string | null;
  payerVpa?: string | null;
  payeeVpa?: string | null;
  createdById?: string;
  transactionDate: Date | string;
  createdAt?: Date;
  updatedAt?: Date;
  runningBalance?: number;
}

export interface StaffMember {
  id: string;
  userId: string;
  businessId: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLogItem {
  id: string;
  transactionId?: string | null;
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ROLE_CHANGE' | 'LOCK_OVERRIDE';
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  performedById?: string | null;
  performedByName?: string | null;
  performedByRole?: string | null;
  createdAt: Date | string;
}

export interface TransactionFilterOptions {
  bookId?: string;
  type?: 'ALL' | TransactionType;
  paymentMode?: 'ALL' | PaymentMode;
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateTransactionInput {
  bookId: string;
  type: TransactionType;
  paymentMode: PaymentMode;
  amount: number;
  category: string;
  note?: string;
  voucherUrl?: string;
  locationGeo?: string;
  transactionDate?: string;
  walletId?: string;
  payerVpa?: string;
  payeeVpa?: string;
  performedBy?: {
    id: string;
    name: string;
    role: Role;
  };
}

export interface UpdateTransactionInput {
  id: string;
  amount?: number;
  category?: string;
  note?: string;
  voucherUrl?: string;
  locationGeo?: string;
  paymentMode?: PaymentMode;
  isLocked?: boolean;
  performedBy: {
    id: string;
    name: string;
    role: Role;
  };
}

export interface BalanceSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  transactionCount: number;
  virtualWalletBalance: number;
  dailySpent: number;
  dailyLimit: number;
}

// In-Memory store for mock fallback and Cloudflare Pages compatibility
const mockStore = {
  business: {
    id: 'biz_default_01',
    name: 'BuildX Technologies Ltd.',
    legalName: 'BuildX Technologies Limited',
    gstin: 'BIN-192837465',
    currency: 'BDT',
    ownerId: 'usr_owner_01',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  wallet: {
    id: 'wal_default_01',
    businessId: 'biz_default_01',
    upiVpa: 'buildx.corp@bkash',
    balance: 85000.0,
    dailyLimit: 30000.0,
    monthlyLimit: 500000.0,
    dailySpent: 4500.0,
    monthlySpent: 42000.0,
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  books: [
    {
      id: 'book_main_01',
      name: 'Main Cash Book',
      description: 'Primary operational cash ledger for BuildX HQ',
      businessId: 'biz_default_01',
      isArchived: false,
      createdAt: new Date(Date.now() - 30 * 86400000),
      updatedAt: new Date(),
    },
    {
      id: 'book_proj_02',
      name: 'Project A Expenses',
      description: 'Site operations, contractor payments, and material vouchers',
      businessId: 'biz_default_01',
      isArchived: false,
      createdAt: new Date(Date.now() - 15 * 86400000),
      updatedAt: new Date(),
    },
    {
      id: 'book_petty_03',
      name: 'Petty Cash & Daily Tea',
      description: 'Office supplies, snacks, courier and utility bills',
      businessId: 'biz_default_01',
      isArchived: false,
      createdAt: new Date(Date.now() - 7 * 86400000),
      updatedAt: new Date(),
    },
  ] as LedgerBook[],
  members: [
    {
      id: 'mem_01',
      userId: 'usr_owner_01',
      businessId: 'biz_default_01',
      role: 'OWNER' as Role,
      name: 'Tanvir Hossain',
      email: 'tanvir@buildx.bd',
      phone: '+8801711000001',
      createdAt: new Date(Date.now() - 60 * 86400000),
      updatedAt: new Date(),
    },
    {
      id: 'mem_02',
      userId: 'usr_finance_02',
      businessId: 'biz_default_01',
      role: 'FINANCE_MANAGER' as Role,
      name: 'Farhana Ahmed',
      email: 'farhana.fin@buildx.bd',
      phone: '+8801711000002',
      createdAt: new Date(Date.now() - 40 * 86400000),
      updatedAt: new Date(),
    },
    {
      id: 'mem_03',
      userId: 'usr_operator_03',
      businessId: 'biz_default_01',
      role: 'DATA_OPERATOR' as Role,
      name: 'Karim Uddin',
      email: 'karim.op@buildx.bd',
      phone: '+8801711000003',
      createdAt: new Date(Date.now() - 20 * 86400000),
      updatedAt: new Date(),
    },
    {
      id: 'mem_04',
      userId: 'usr_viewer_04',
      businessId: 'biz_default_01',
      role: 'VIEWER' as Role,
      name: 'Ayesha Siddiqua',
      email: 'ayesha.auditor@buildx.bd',
      phone: '+8801711000004',
      createdAt: new Date(Date.now() - 10 * 86400000),
      updatedAt: new Date(),
    },
  ] as StaffMember[],
  transactions: [
    {
      id: 'tx_init_01',
      bookId: 'book_main_01',
      type: 'INCOME',
      paymentMode: 'BANK_TRANSFER',
      amount: 150000,
      category: 'Client Retainer',
      note: 'Advance for Q3 System Architecture & Cloud Migration',
      voucherUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      locationGeo: '23.8103,90.4125',
      isLocked: true,
      status: 'COMPLETED',
      walletId: null,
      upiRefNumber: '426810293847',
      payerVpa: 'client.corp@bank',
      payeeVpa: 'buildx@bank',
      createdById: 'usr_owner_01',
      transactionDate: new Date(Date.now() - 5 * 86400000),
      createdAt: new Date(Date.now() - 5 * 86400000), // > 24h old (Auto-Locked)
      updatedAt: new Date(Date.now() - 5 * 86400000),
    },
    {
      id: 'tx_init_02',
      bookId: 'book_main_01',
      type: 'EXPENSE',
      paymentMode: 'VIRTUAL_WALLET',
      amount: 12500,
      category: 'Cloud Infrastructure',
      note: 'Monthly Cloudflare Pages and Database Hosting renewal',
      voucherUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
      locationGeo: '23.8103,90.4125',
      isLocked: true,
      status: 'COMPLETED',
      walletId: 'wal_default_01',
      upiRefNumber: '426899128374',
      payerVpa: 'buildx.corp@bkash',
      payeeVpa: 'cloudflare@merch',
      createdById: 'usr_finance_02',
      transactionDate: new Date(Date.now() - 3 * 86400000),
      createdAt: new Date(Date.now() - 3 * 86400000), // > 24h old
      updatedAt: new Date(Date.now() - 3 * 86400000),
    },
    {
      id: 'tx_init_03',
      bookId: 'book_main_01',
      type: 'EXPENSE',
      paymentMode: 'CASH',
      amount: 3200,
      category: 'Office Supply',
      note: 'Paper, ink, stationary and courier to Chattogram office',
      voucherUrl: '',
      locationGeo: '23.7925,90.4078',
      isLocked: false,
      status: 'COMPLETED',
      walletId: null,
      upiRefNumber: null,
      payerVpa: null,
      payeeVpa: null,
      createdById: 'usr_operator_03',
      transactionDate: new Date(Date.now() - 2 * 3600000), // 2 hours old! Within 24h window
      createdAt: new Date(Date.now() - 2 * 3600000),
      updatedAt: new Date(Date.now() - 2 * 3600000),
    },
    {
      id: 'tx_init_04',
      bookId: 'book_proj_02',
      type: 'INCOME',
      paymentMode: 'BANK_TRANSFER',
      amount: 80000,
      category: 'Project Funding',
      note: 'Initial budget allocation for Project A',
      voucherUrl: '',
      locationGeo: '23.8103,90.4125',
      isLocked: true,
      status: 'COMPLETED',
      walletId: null,
      upiRefNumber: '426855123490',
      payerVpa: null,
      payeeVpa: null,
      createdById: 'usr_owner_01',
      transactionDate: new Date(Date.now() - 10 * 86400000),
      createdAt: new Date(Date.now() - 10 * 86400000),
      updatedAt: new Date(Date.now() - 10 * 86400000),
    },
    {
      id: 'tx_init_05',
      bookId: 'book_proj_02',
      type: 'EXPENSE',
      paymentMode: 'CASH',
      amount: 14500,
      category: 'Equipment Rental',
      note: 'Testing hardware and surveyor field equipment',
      voucherUrl: '',
      locationGeo: '23.8103,90.4125',
      isLocked: false,
      status: 'COMPLETED',
      walletId: null,
      upiRefNumber: null,
      payerVpa: null,
      payeeVpa: null,
      createdById: 'usr_operator_03',
      transactionDate: new Date(Date.now() - 4 * 86400000),
      createdAt: new Date(Date.now() - 4 * 86400000),
      updatedAt: new Date(Date.now() - 4 * 86400000),
    },
  ] as LedgerTransaction[],
  auditLogs: [
    {
      id: 'aud_01',
      transactionId: 'tx_init_01',
      entityType: 'TRANSACTION',
      entityId: 'tx_init_01',
      action: 'CREATE',
      newValues: { amount: 150000, type: 'INCOME', category: 'Client Retainer' },
      performedById: 'usr_owner_01',
      performedByName: 'Tanvir Hossain',
      performedByRole: 'OWNER',
      createdAt: new Date(Date.now() - 5 * 86400000),
    },
    {
      id: 'aud_02',
      transactionId: 'tx_init_02',
      entityType: 'TRANSACTION',
      entityId: 'tx_init_02',
      action: 'CREATE',
      newValues: { amount: 12500, type: 'EXPENSE', category: 'Cloud Infrastructure' },
      performedById: 'usr_finance_02',
      performedByName: 'Farhana Ahmed',
      performedByRole: 'FINANCE_MANAGER',
      createdAt: new Date(Date.now() - 3 * 86400000),
    },
    {
      id: 'aud_03',
      transactionId: 'tx_init_03',
      entityType: 'TRANSACTION',
      entityId: 'tx_init_03',
      action: 'CREATE',
      newValues: { amount: 3200, type: 'EXPENSE', category: 'Office Supply' },
      performedById: 'usr_operator_03',
      performedByName: 'Karim Uddin',
      performedByRole: 'DATA_OPERATOR',
      createdAt: new Date(Date.now() - 2 * 3600000),
    },
  ] as AuditLogItem[],
};

export class LedgerService {
  /**
   * Fetch all books / ledgers for the business
   */
  static async getBooks(businessId?: string): Promise<LedgerBook[]> {
    try {
      const books = await prisma.book.findMany({
        where: {
          isArchived: false,
          ...(businessId ? { businessId } : {}),
        },
        include: {
          _count: {
            select: { transactions: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      if (books && books.length > 0) {
        return books;
      }
    } catch (error) {
      console.warn('[LedgerService] Database query fallback:', (error as Error).message);
    }

    return mockStore.books.map((b) => ({
      ...b,
      _count: {
        transactions: mockStore.transactions.filter((t) => t.bookId === b.id).length,
      },
    }));
  }

  /**
   * Create a new book / ledger
   */
  static async createBook(input: { name: string; description?: string; businessId?: string }): Promise<LedgerBook> {
    const businessId = input.businessId ?? mockStore.business.id;

    try {
      const newBook = await prisma.book.create({
        data: {
          name: input.name,
          description: input.description,
          businessId,
        },
      });
      return newBook;
    } catch {
      // Fallback to mock store
    }

    const newBook: LedgerBook = {
      id: `book_${Date.now()}`,
      name: input.name,
      description: input.description ?? null,
      businessId,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockStore.books.push(newBook);
    return newBook;
  }

  /**
   * Get virtual wallet details
   */
  static async getWallet(businessId?: string) {
    try {
      const wallet = await prisma.virtualWallet.findFirst({
        where: businessId ? { businessId } : {},
      });
      if (wallet) {
        return {
          id: wallet.id,
          businessId: wallet.businessId,
          upiVpa: wallet.upiVpa,
          balance: Number(wallet.balance),
          dailyLimit: Number(wallet.dailyLimit),
          monthlyLimit: Number(wallet.monthlyLimit),
          dailySpent: Number(wallet.dailySpent),
          monthlySpent: Number(wallet.monthlySpent),
          status: wallet.status,
        };
      }
    } catch {
      // fallback
    }

    return mockStore.wallet;
  }

  /**
   * Get transactions for a book with filters and running balance calculation
   */
  static async getTransactions(options: TransactionFilterOptions): Promise<LedgerTransaction[]> {
    const {
      bookId,
      type = 'ALL',
      paymentMode = 'ALL',
      category,
      startDate,
      endDate,
      search,
    } = options;

    let txList: LedgerTransaction[];

    try {
      const whereClause: Record<string, unknown> = {};
      if (bookId) whereClause.bookId = bookId;
      if (type && type !== 'ALL') whereClause.type = type;
      if (paymentMode && paymentMode !== 'ALL') whereClause.paymentMode = paymentMode;
      if (category && category !== 'ALL') whereClause.category = category;
      if (startDate || endDate) {
        whereClause.transactionDate = {
          ...(startDate ? { gte: new Date(startDate) } : {}),
          ...(endDate ? { lte: new Date(endDate) } : {}),
        };
      }
      if (search) {
        whereClause.OR = [
          { note: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
        ];
      }

      const dbTransactions = await prisma.transaction.findMany({
        where: whereClause,
        orderBy: { transactionDate: 'desc' },
      });

      if (dbTransactions) {
        txList = dbTransactions.map((t) => ({
          ...t,
          amount: Number(t.amount),
        }));
      } else {
        txList = [];
      }
    } catch {
      txList = mockStore.transactions.filter((t) => {
        if (bookId && t.bookId !== bookId) return false;
        if (type && type !== 'ALL' && t.type !== type) return false;
        if (paymentMode && paymentMode !== 'ALL' && t.paymentMode !== paymentMode) return false;
        if (category && category !== 'ALL' && t.category !== category) return false;
        if (startDate && new Date(t.transactionDate) < new Date(startDate)) return false;
        if (endDate && new Date(t.transactionDate) > new Date(endDate)) return false;
        if (search) {
          const s = search.toLowerCase();
          const matchNote = t.note?.toLowerCase().includes(s);
          const matchCat = t.category.toLowerCase().includes(s);
          if (!matchNote && !matchCat) return false;
        }
        return true;
      });
    }

    // Process 24-hour auto lock flag
    const processedTxList = txList.map((t) => {
      const isAgeLocked = isTransactionLockedByAge(t.createdAt || t.transactionDate);
      return {
        ...t,
        isLocked: t.isLocked || isAgeLocked,
      };
    });

    const chronological = [...processedTxList].sort(
      (a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
    );

    let running = 0;
    const withRunningBalance = chronological.map((t) => {
      const amt = Number(t.amount);
      if (t.type === 'INCOME') {
        running += amt;
      } else {
        running -= amt;
      }
      return {
        ...t,
        runningBalance: running,
      };
    });

    return withRunningBalance.reverse();
  }

  /**
   * Get balance summary metrics
   */
  static async getBalanceSummary(bookId?: string): Promise<BalanceSummary> {
    const transactions = await this.getTransactions({ bookId });
    const wallet = await this.getWallet();

    let totalIncome = 0;
    let totalExpense = 0;

    for (const t of transactions) {
      const amt = Number(t.amount);
      if (t.type === 'INCOME') {
        totalIncome += amt;
      } else {
        totalExpense += amt;
      }
    }

    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      transactionCount: transactions.length,
      virtualWalletBalance: wallet.balance,
      dailySpent: wallet.dailySpent,
      dailyLimit: wallet.dailyLimit,
    };
  }

  /**
   * Create a new transaction with Virtual Wallet limits verification and Audit Logging
   */
  static async createTransaction(input: CreateTransactionInput): Promise<LedgerTransaction> {
    const {
      bookId,
      type,
      paymentMode,
      amount,
      category,
      note = '',
      voucherUrl = '',
      locationGeo = '',
      transactionDate = new Date().toISOString(),
      performedBy = { id: 'usr_owner_01', name: 'Tanvir Hossain', role: 'OWNER' as Role },
    } = input;

    if (!amount || amount <= 0) {
      throw new Error('Transaction amount must be greater than 0 BDT');
    }

    const wallet = await this.getWallet();
    let upiRefNumber: string | null = null;

    if (paymentMode === 'VIRTUAL_WALLET' || paymentMode === 'VIRTUAL_UPI') {
      const validation = mockPaymentAdapter.verifyWalletBalanceAndLimits({
        walletId: wallet.id,
        amount,
        type,
        currentBalance: wallet.balance,
        dailyLimit: wallet.dailyLimit,
        dailySpent: wallet.dailySpent,
        monthlyLimit: wallet.monthlyLimit,
        monthlySpent: wallet.monthlySpent,
      });

      if (!validation.valid) {
        throw new Error(validation.reason ?? 'Virtual Wallet validation failed');
      }

      mockStore.wallet.balance = validation.newBalance;
      mockStore.wallet.dailySpent = validation.newDailySpent;
      mockStore.wallet.monthlySpent = validation.newMonthlySpent;

      const mockPay = await mockPaymentAdapter.initiatePayment({
        amount,
        payeeVpa: 'merchant@bkash',
        payerVpa: wallet.upiVpa ?? 'employee@buildx',
        note,
      });
      upiRefNumber = mockPay.upiRefNumber;
    }

    const newTxId = `tx_${Date.now()}`;
    const txDateObj = new Date(transactionDate);

    try {
      const dbTx = await prisma.transaction.create({
        data: {
          bookId,
          type,
          paymentMode,
          amount,
          category,
          note,
          voucherUrl,
          locationGeo,
          upiRefNumber,
          createdById: performedBy.id,
          transactionDate: txDateObj,
          walletId: paymentMode === 'VIRTUAL_WALLET' || paymentMode === 'VIRTUAL_UPI' ? wallet.id : null,
        },
      });

      await prisma.auditLog.create({
        data: {
          transactionId: dbTx.id,
          entityType: 'TRANSACTION',
          entityId: dbTx.id,
          action: 'CREATE',
          newValues: {
            amount,
            type,
            paymentMode,
            category,
            note,
            bookId,
          },
          performedById: performedBy.id,
        },
      });

      return {
        ...dbTx,
        amount: Number(dbTx.amount),
      };
    } catch {
      // Fallback
    }

    const mockTx: LedgerTransaction = {
      id: newTxId,
      bookId,
      type,
      paymentMode,
      amount,
      category,
      note,
      voucherUrl,
      locationGeo,
      isLocked: false,
      status: 'COMPLETED',
      walletId: paymentMode === 'VIRTUAL_WALLET' || paymentMode === 'VIRTUAL_UPI' ? wallet.id : null,
      upiRefNumber,
      payerVpa: wallet.upiVpa,
      payeeVpa: null,
      createdById: performedBy.id,
      transactionDate: txDateObj,
      createdAt: new Date(),
      updatedAt: new Date(),
      runningBalance: 0,
    };

    mockStore.transactions.unshift(mockTx);

    mockStore.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      transactionId: newTxId,
      entityType: 'TRANSACTION',
      entityId: newTxId,
      action: 'CREATE',
      newValues: { amount, type, paymentMode, category, note },
      performedById: performedBy.id,
      performedByName: performedBy.name,
      performedByRole: performedBy.role,
      createdAt: new Date(),
    });

    return mockTx;
  }

  /**
   * Update an existing transaction with strict 24-hour RBAC lock checks and audit logging
   */
  static async updateTransaction(input: UpdateTransactionInput): Promise<LedgerTransaction> {
    const { id, amount, category, note, voucherUrl, locationGeo, paymentMode, isLocked, performedBy } =
      input;

    // Find existing transaction
    const existing = mockStore.transactions.find((t) => t.id === id);
    if (!existing) {
      throw new Error(`Transaction with ID "${id}" not found.`);
    }

    // RBAC & 24h Lock Permission Check
    const check = canEditTransaction(
      performedBy.role,
      {
        createdAt: existing.createdAt || existing.transactionDate,
        isLocked: existing.isLocked,
        createdById: existing.createdById,
      },
      performedBy.id
    );

    if (!check.allowed) {
      throw new Error(check.reason || 'You do not have permission to edit this transaction.');
    }

    const oldSnapshot = { ...existing };

    if (amount !== undefined && amount > 0) {
      existing.amount = amount;
    }
    if (category) existing.category = category;
    if (note !== undefined) existing.note = note;
    if (voucherUrl !== undefined) existing.voucherUrl = voucherUrl;
    if (locationGeo !== undefined) existing.locationGeo = locationGeo;
    if (paymentMode) existing.paymentMode = paymentMode;
    if (isLocked !== undefined) existing.isLocked = isLocked;
    existing.updatedAt = new Date();

    const newSnapshot = { ...existing };

    // Record Immutable Audit Log
    mockStore.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      transactionId: id,
      entityType: 'TRANSACTION',
      entityId: id,
      action: 'UPDATE',
      oldValues: oldSnapshot as unknown as Record<string, unknown>,
      newValues: newSnapshot as unknown as Record<string, unknown>,
      performedById: performedBy.id,
      performedByName: performedBy.name,
      performedByRole: performedBy.role,
      createdAt: new Date(),
    });

    try {
      await prisma.transaction.update({
        where: { id },
        data: {
          ...(amount ? { amount } : {}),
          ...(category ? { category } : {}),
          ...(note !== undefined ? { note } : {}),
          ...(voucherUrl !== undefined ? { voucherUrl } : {}),
          ...(isLocked !== undefined ? { isLocked } : {}),
        },
      });
    } catch {
      // Prisma fallback
    }

    return existing;
  }

  /**
   * Delete a transaction with RBAC & 24h lock enforcement and audit logging
   */
  static async deleteTransaction(
    id: string,
    performedBy: { id: string; name: string; role: Role }
  ): Promise<{ success: boolean; message: string }> {
    const existingIndex = mockStore.transactions.findIndex((t) => t.id === id);
    if (existingIndex === -1) {
      throw new Error(`Transaction with ID "${id}" not found.`);
    }

    const existing = mockStore.transactions[existingIndex];

    // RBAC & 24h Lock Permission Check
    const check = canDeleteTransaction(
      performedBy.role,
      {
        createdAt: existing.createdAt || existing.transactionDate,
        isLocked: existing.isLocked,
        createdById: existing.createdById,
      },
      performedBy.id
    );

    if (!check.allowed) {
      throw new Error(check.reason || 'You do not have permission to delete this transaction.');
    }

    const [deletedTx] = mockStore.transactions.splice(existingIndex, 1);

    // Record Immutable Audit Log
    mockStore.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      transactionId: id,
      entityType: 'TRANSACTION',
      entityId: id,
      action: 'DELETE',
      oldValues: deletedTx as unknown as Record<string, unknown>,
      newValues: null,
      performedById: performedBy.id,
      performedByName: performedBy.name,
      performedByRole: performedBy.role,
      createdAt: new Date(),
    });

    try {
      await prisma.transaction.delete({ where: { id } });
    } catch {
      // Prisma fallback
    }

    return {
      success: true,
      message: `Transaction ${id} deleted and recorded to immutable audit log.`,
    };
  }

  /**
   * Fetch all staff members for the business
   */
  static async getMembers(businessId?: string): Promise<StaffMember[]> {
    if (businessId) {
      return mockStore.members.filter((m) => m.businessId === businessId);
    }
    return mockStore.members;
  }

  /**
   * Add / invite a new staff member to the business with an assigned role
   */
  static async addMember(input: {
    name: string;
    email: string;
    phone?: string;
    role: Role;
    performedBy: { id: string; name: string; role: Role };
  }): Promise<StaffMember> {
    const { name, email, phone, role, performedBy } = input;

    if (!canManageStaff(performedBy.role, role)) {
      throw new Error(`Your role (${performedBy.role}) cannot assign or invite a member with role "${role}".`);
    }

    const existing = mockStore.members.find((m) => m.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error(`A member with email "${email}" already exists.`);
    }

    const newMember: StaffMember = {
      id: `mem_${Date.now()}`,
      userId: `usr_${Date.now()}`,
      businessId: mockStore.business.id,
      name,
      email: email.toLowerCase(),
      phone: phone || null,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockStore.members.push(newMember);

    mockStore.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      entityType: 'BUSINESS_MEMBER',
      entityId: newMember.id,
      action: 'ROLE_CHANGE',
      newValues: { name, email, role },
      performedById: performedBy.id,
      performedByName: performedBy.name,
      performedByRole: performedBy.role,
      createdAt: new Date(),
    });

    return newMember;
  }

  /**
   * Update role of an existing staff member
   */
  static async updateMemberRole(input: {
    memberId: string;
    newRole: Role;
    performedBy: { id: string; name: string; role: Role };
  }): Promise<StaffMember> {
    const { memberId, newRole, performedBy } = input;
    const member = mockStore.members.find((m) => m.id === memberId);
    if (!member) {
      throw new Error(`Member with ID "${memberId}" not found.`);
    }

    if (!canManageStaff(performedBy.role, newRole)) {
      throw new Error(`Your role (${performedBy.role}) is not authorized to assign role "${newRole}".`);
    }

    const oldRole = member.role;
    member.role = newRole;
    member.updatedAt = new Date();

    mockStore.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      entityType: 'BUSINESS_MEMBER',
      entityId: memberId,
      action: 'ROLE_CHANGE',
      oldValues: { role: oldRole },
      newValues: { role: newRole },
      performedById: performedBy.id,
      performedByName: performedBy.name,
      performedByRole: performedBy.role,
      createdAt: new Date(),
    });

    return member;
  }

  /**
   * Remove a staff member from the business
   */
  static async removeMember(
    memberId: string,
    performedBy: { id: string; name: string; role: Role }
  ): Promise<{ success: boolean; message: string }> {
    const index = mockStore.members.findIndex((m) => m.id === memberId);
    if (index === -1) {
      throw new Error(`Member with ID "${memberId}" not found.`);
    }

    const member = mockStore.members[index];
    if (member.role === 'OWNER') {
      throw new Error('Cannot remove the business OWNER.');
    }

    if (!canManageStaff(performedBy.role, member.role)) {
      throw new Error(`Your role (${performedBy.role}) cannot revoke access for role "${member.role}".`);
    }

    const [removed] = mockStore.members.splice(index, 1);

    mockStore.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      entityType: 'BUSINESS_MEMBER',
      entityId: memberId,
      action: 'DELETE',
      oldValues: { name: removed.name, email: removed.email, role: removed.role },
      performedById: performedBy.id,
      performedByName: performedBy.name,
      performedByRole: performedBy.role,
      createdAt: new Date(),
    });

    return { success: true, message: `Access for ${removed.name} revoked.` };
  }

  /**
   * Fetch immutable audit logs
   */
  static async getAuditLogs(options?: { bookId?: string; limit?: number }): Promise<AuditLogItem[]> {
    const limit = options?.limit || 50;
    return mockStore.auditLogs.slice(0, limit);
  }
}
