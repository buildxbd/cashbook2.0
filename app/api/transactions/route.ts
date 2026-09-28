import { NextRequest, NextResponse } from 'next/server';
import { LedgerService } from '@/lib/services/ledger-service';
import { PaymentMode, TransactionType } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get('bookId') ?? undefined;
    const type = (searchParams.get('type') ?? 'ALL') as 'ALL' | TransactionType;
    const paymentMode = (searchParams.get('paymentMode') ?? 'ALL') as 'ALL' | PaymentMode;
    const category = searchParams.get('category') ?? undefined;
    const startDate = searchParams.get('startDate') ?? undefined;
    const endDate = searchParams.get('endDate') ?? undefined;
    const search = searchParams.get('search') ?? undefined;

    const [transactions, summary] = await Promise.all([
      LedgerService.getTransactions({
        bookId,
        type,
        paymentMode,
        category,
        startDate,
        endDate,
        search,
      }),
      LedgerService.getBalanceSummary(bookId),
    ]);

    return NextResponse.json({
      success: true,
      data: transactions,
      summary,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || 'Failed to fetch transactions',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      bookId,
      type,
      paymentMode,
      amount,
      category,
      note,
      voucherUrl,
      locationGeo,
      transactionDate,
    } = body;

    if (!bookId) {
      return NextResponse.json(
        { success: false, error: 'Book ID is required' },
        { status: 400 }
      );
    }

    if (!type || !['INCOME', 'EXPENSE'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid transaction type: Must be INCOME or EXPENSE' },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than 0 BDT' },
        { status: 400 }
      );
    }

    if (!category || !category.trim()) {
      return NextResponse.json(
        { success: false, error: 'Category is required' },
        { status: 400 }
      );
    }

    // Call service which enforces MockPaymentAdapter wallet checks for VIRTUAL_WALLET
    const newTransaction = await LedgerService.createTransaction({
      bookId,
      type: type as TransactionType,
      paymentMode: (paymentMode ?? 'CASH') as PaymentMode,
      amount: numericAmount,
      category: category.trim(),
      note: note?.trim(),
      voucherUrl: voucherUrl?.trim(),
      locationGeo: locationGeo?.trim(),
      transactionDate,
    });

    return NextResponse.json(
      {
        success: true,
        data: newTransaction,
        message: 'Transaction recorded successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || 'Failed to create transaction',
      },
      { status: 400 }
    );
  }
}
