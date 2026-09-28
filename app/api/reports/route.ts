import { NextRequest, NextResponse } from 'next/server';
import { LedgerService } from '@/lib/services/ledger-service';
import { resolveDateRange } from '@/lib/reports/date-utils';
import {
  DateRangePreset,
  CategoryBreakdownItem,
  PaymentModeBreakdownItem,
  DailyTrendItem,
  ReportAnalyticsSummary,
} from '@/lib/reports/report-types';
import { PaymentMode, TransactionType } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get('bookId') ?? undefined;
    const preset = (searchParams.get('preset') || 'THIS_MONTH') as DateRangePreset;
    const customStart = searchParams.get('startDate') ?? undefined;
    const customEnd = searchParams.get('endDate') ?? undefined;
    const category = searchParams.get('category') ?? undefined;
    const paymentMode = (searchParams.get('paymentMode') ?? 'ALL') as 'ALL' | PaymentMode;
    const operatorId = searchParams.get('operatorId') ?? undefined;

    const { start, end } = resolveDateRange(preset, customStart, customEnd);

    // Fetch transactions for the given criteria
    const allTransactions = await LedgerService.getTransactions({
      bookId,
      category: category && category !== 'ALL' ? category : undefined,
      paymentMode: paymentMode && paymentMode !== 'ALL' ? paymentMode : undefined,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });

    // Filter by operatorId if provided
    const transactions = operatorId && operatorId !== 'ALL'
      ? allTransactions.filter((t) => t.createdById === operatorId)
      : allTransactions;

    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;
    let virtualWalletExpense = 0;
    let cashExpense = 0;
    let bankExpense = 0;

    const categoryMap: Record<string, { type: TransactionType; amount: number; count: number }> = {};
    const modeMap: Record<string, { amount: number; count: number }> = {};
    const trendMap: Record<string, { income: number; expense: number }> = {};

    for (const tx of transactions) {
      const amt = Number(tx.amount);
      const dStr = new Date(tx.transactionDate).toISOString().split('T')[0];

      if (!trendMap[dStr]) {
        trendMap[dStr] = { income: 0, expense: 0 };
      }

      if (tx.type === 'INCOME') {
        totalIncome += amt;
        incomeCount++;
        trendMap[dStr].income += amt;
      } else {
        totalExpense += amt;
        expenseCount++;
        trendMap[dStr].expense += amt;

        if (tx.paymentMode === 'VIRTUAL_WALLET' || tx.paymentMode === 'VIRTUAL_UPI') {
          virtualWalletExpense += amt;
        } else if (tx.paymentMode === 'CASH') {
          cashExpense += amt;
        } else if (tx.paymentMode === 'BANK_TRANSFER') {
          bankExpense += amt;
        }
      }

      // Category grouping
      if (!categoryMap[tx.category]) {
        categoryMap[tx.category] = { type: tx.type, amount: 0, count: 0 };
      }
      categoryMap[tx.category].amount += amt;
      categoryMap[tx.category].count += 1;

      // Mode grouping
      if (!modeMap[tx.paymentMode]) {
        modeMap[tx.paymentMode] = { amount: 0, count: 0 };
      }
      modeMap[tx.paymentMode].amount += amt;
      modeMap[tx.paymentMode].count += 1;
    }

    const netBalance = totalIncome - totalExpense;
    const transactionCount = transactions.length;
    const totalTurnover = totalIncome + totalExpense;

    // Build Category Breakdown
    const categoryBreakdown: CategoryBreakdownItem[] = Object.entries(categoryMap).map(
      ([cat, data]) => ({
        category: cat,
        type: data.type,
        totalAmount: data.amount,
        count: data.count,
        percentage: totalTurnover > 0 ? Math.round((data.amount / totalTurnover) * 100) : 0,
      })
    ).sort((a, b) => b.totalAmount - a.totalAmount);

    // Build Payment Mode Breakdown
    const paymentModeBreakdown: PaymentModeBreakdownItem[] = Object.entries(modeMap).map(
      ([mode, data]) => ({
        paymentMode: mode as PaymentMode,
        totalAmount: data.amount,
        count: data.count,
        percentage: totalTurnover > 0 ? Math.round((data.amount / totalTurnover) * 100) : 0,
      })
    ).sort((a, b) => b.totalAmount - a.totalAmount);

    // Build Daily Trend
    const dailyTrends: DailyTrendItem[] = Object.entries(trendMap)
      .map(([date, val]) => ({
        date,
        income: val.income,
        expense: val.expense,
        net: val.income - val.expense,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const summary: ReportAnalyticsSummary = {
      totalIncome,
      totalExpense,
      netBalance,
      transactionCount,
      incomeCount,
      expenseCount,
      averageTransaction: transactionCount > 0 ? Math.round(totalTurnover / transactionCount) : 0,
      virtualWalletExpense,
      cashExpense,
      bankExpense,
      categoryBreakdown,
      paymentModeBreakdown,
      dailyTrends,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      preset,
    };

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        summary,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || 'Failed to generate report analytics',
      },
      { status: 500 }
    );
  }
}
