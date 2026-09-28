import { NextRequest, NextResponse } from 'next/server';
import { LedgerService } from '@/lib/services/ledger-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId') ?? undefined;

    const books = await LedgerService.getBooks(businessId);
    return NextResponse.json({
      success: true,
      data: books,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || 'Failed to fetch books',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, businessId } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Book name is required',
        },
        { status: 400 }
      );
    }

    const newBook = await LedgerService.createBook({
      name: name.trim(),
      description: description?.trim(),
      businessId,
    });

    return NextResponse.json(
      {
        success: true,
        data: newBook,
        message: 'Book created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || 'Failed to create book',
      },
      { status: 500 }
    );
  }
}
