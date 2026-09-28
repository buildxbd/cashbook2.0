import { NextRequest, NextResponse } from 'next/server';
import { LedgerService } from '@/lib/services/ledger-service';
import { generateTallyPrimeXML, generateAccountingCSV } from '@/lib/erp/tally-transformer';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get('bookId') || undefined;
    const format = (searchParams.get('format') || 'xml').toLowerCase();
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const companyName = searchParams.get('companyName') || 'CashBook 2.0 Business';

    // Retrieve transactions for the selected ledger/book
    const transactions = await LedgerService.getTransactions({
      bookId,
      startDate,
      endDate,
    });

    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');

    if (format === 'csv') {
      const csvData = generateAccountingCSV(transactions);
      return new NextResponse(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="cashbook-accounting-${timestamp}.csv"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    // Default to Tally Prime XML
    const xmlData = generateTallyPrimeXML(transactions, companyName);
    return new NextResponse(xmlData, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="cashbook-tally-prime-${timestamp}.xml"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[Export Tally API Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export Tally Prime data',
      },
      { status: 500 }
    );
  }
}
