import { NextRequest, NextResponse } from 'next/server';
import { LedgerService } from '@/lib/services/ledger-service';
import { PaymentMode, TransactionType, Role } from '@prisma/client';
import { canAddTransaction } from '@/lib/auth/permissions';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

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
      performedBy = { id: 'usr_owner_01', name: 'Tanvir Hossain', role: 'OWNER' as Role },
    } = body;

    // RBAC check: Can user add transactions?
    if (!canAddTransaction(performedBy.role)) {
      return NextResponse.json(
        {
          success: false,
          error: `Role "${performedBy.role}" has read-only access and cannot record transactions.`,
        },
        { status: 403 }
      );
    }

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
      performedBy,
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

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      amount,
      category,
      note,
      voucherUrl,
      locationGeo,
      paymentMode,
      isLocked,
      performedBy = { id: 'usr_owner_01', name: 'Tanvir Hossain', role: 'OWNER' as Role },
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    const updated = await LedgerService.updateTransaction({
      id,
      amount: amount !== undefined ? Number(amount) : undefined,
      category,
      note,
      voucherUrl,
      locationGeo,
      paymentMode,
      isLocked,
      performedBy,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Transaction updated successfully',
    });
  } catch (error) {
    const msg = (error as Error).message;
    const isPermissionError = msg.includes('locked') || msg.includes('permission') || msg.includes('Expired');
    return NextResponse.json(
      { success: false, error: msg },
      { status: isPermissionError ? 403 : 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const role = (searchParams.get('role') || 'OWNER') as Role;
    const userId = searchParams.get('userId') || 'usr_owner_01';
    const userName = searchParams.get('userName') || 'Tanvir Hossain';

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID parameter is required' },
        { status: 400 }
      );
    }

    const res = await LedgerService.deleteTransaction(id, {
      id: userId,
      name: userName,
      role,
    });

    return NextResponse.json({
      success: true,
      message: res.message,
    });
  } catch (error) {
    const msg = (error as Error).message;
    const isPermissionError = msg.includes('locked') || msg.includes('permission') || msg.includes('Expired');
    return NextResponse.json(
      { success: false, error: msg },
      { status: isPermissionError ? 403 : 400 }
    );
  }
}
