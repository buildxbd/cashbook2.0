import { PaymentMode, TransactionType } from '@prisma/client';

export type DateRangePreset =
  | 'TODAY'
  | 'YESTERDAY'
  | 'THIS_WEEK'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'ALL_TIME'
  | 'CUSTOM';

export interface ReportFilterOptions {
  bookId?: string;
  preset?: DateRangePreset;
  startDate?: string;
  endDate?: string;
  category?: string;
  paymentMode?: 'ALL' | PaymentMode;
  operatorId?: string;
}

export interface CategoryBreakdownItem {
  category: string;
  type: TransactionType;
  totalAmount: number;
  count: number;
  percentage: number;
}

export interface PaymentModeBreakdownItem {
  paymentMode: PaymentMode;
  totalAmount: number;
  count: number;
  percentage: number;
}

export interface DailyTrendItem {
  date: string;
  income: number;
  expense: number;
  net: number;
}

export interface ReportAnalyticsSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  transactionCount: number;
  incomeCount: number;
  expenseCount: number;
  averageTransaction: number;
  virtualWalletExpense: number;
  cashExpense: number;
  bankExpense: number;
  categoryBreakdown: CategoryBreakdownItem[];
  paymentModeBreakdown: PaymentModeBreakdownItem[];
  dailyTrends: DailyTrendItem[];
  startDate: string;
  endDate: string;
  preset: DateRangePreset;
}
