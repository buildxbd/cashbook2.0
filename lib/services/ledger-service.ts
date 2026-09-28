import { prisma } from '@/lib/prisma';
import { mockPaymentAdapter } from '@/lib/payment/mock-adapter';
import { PaymentMode, TransactionType } from '@prisma/client';

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

// In-Memory fallback store for environments without a live PostgreSQL connection (e.g., Cloudflare Pages edge / local testing)
const mockStore = {
  business: {
    id: 'biz_default_01',
    name: 'BuildX Technologies Ltd.',
    legalName: 'BuildX Technologies Limited',
    gstin: 'BIN-192837465',
    currency: 'BDT',
    ownerId: 'usr_default_01',
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
      createdById: 'usr_default_01',
      transactionDate: new Date(Date.now() - 5 * 86400000),
      createdAt: new Date(Date.now() - 5 * 86400000),
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
      isLocked: false,
      status: 'COMPLETED',
      walletId: 'wal_default_01',
      upiRefNumber: '426899128374',
      payerVpa: 'buildx.corp@bkash',
      payeeVpa: 'cloudflare@merch',
      createdById: 'usr_default_01',
      transactionDate: new Date(Date.now() - 3 * 86400000),
      createdAt: new Date(Date.now() - 3 * 86400000),
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
      createdById: 'usr_default_01',
      transactionDate: new Date(Date.now() - 1 * 86400000),
      createdAt: new Date(Date.now() - 1 * 86400000),
      updatedAt: new Date(Date.now() - 1 * 86400000),
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
      createdById: 'usr_default_01',
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
      createdById: 'usr_default_01',
      transactionDate: new Date(Date.now() - 4 * 86400000),
      createdAt: new Date(Date.now() - 4 * 86400000),
      updatedAt: new Date(Date.now() - 4 * 86400000),
    },
  ] as LedgerTransaction[],
  auditLogs: [] as Array<Record<string, unknown>>,
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
      console.warn('[LedgerService] Database query failed or unavailable, using in-memory store:', (error as Error).message);
    }

    // Fallback to in-memory store
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
    } catch (error) {
      console.warn('[LedgerService] Prisma book creation failed, using mock store:', (error as Error).message);
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
      // Fall through to mock store
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
      // Filter mock store
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

    // Sort ascending to calculate running balance, then reverse for display
    const chronological = [...txList].sort(
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

    // Display order: newest first
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
    } = input;

    if (!amount || amount <= 0) {
      throw new Error('Transaction amount must be greater than 0 BDT');
    }

    const wallet = await this.getWallet();
    let upiRefNumber: string | null = null;

    // INTEGRATION WITH MockPaymentAdapter FOR VIRTUAL_WALLET
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

      // Update mock wallet state
      mockStore.wallet.balance = validation.newBalance;
      mockStore.wallet.dailySpent = validation.newDailySpent;
      mockStore.wallet.monthlySpent = validation.newMonthlySpent;

      // Generate simulated UPI RRN
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
          createdById: 'usr_default_01',
          transactionDate: txDateObj,
          walletId: paymentMode === 'VIRTUAL_WALLET' || paymentMode === 'VIRTUAL_UPI' ? wallet.id : null,
        },
      });

      // Create Audit Log
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
          performedById: 'usr_default_01',
        },
      });

      return {
        ...dbTx,
        amount: Number(dbTx.amount),
      };
    } catch (err) {
      console.warn('[LedgerService] Prisma transaction create failed, using mock store:', (err as Error).message);
    }

    // Save to mock store
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
      createdById: 'usr_default_01',
      transactionDate: txDateObj,
      createdAt: new Date(),
      updatedAt: new Date(),
      runningBalance: 0,
    };

    mockStore.transactions.unshift(mockTx);

    // Append to mock audit logs
    mockStore.auditLogs.push({
      id: `audit_${Date.now()}`,
      transactionId: newTxId,
      action: 'CREATE',
      timestamp: new Date().toISOString(),
      details: { amount, type, paymentMode, category },
    });

    return mockTx;
  }
}
