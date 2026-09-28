import * as XLSX from 'xlsx';
import { LedgerTransaction } from '@/lib/services/ledger-service';

export interface ExcelExportOptions {
  businessName?: string;
  bookName: string;
  startDate: string;
  endDate: string;
  transactions: LedgerTransaction[];
  summary: {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
    transactionCount: number;
  };
}

export function exportToExcel(options: ExcelExportOptions, customFilename?: string) {
  const {
    businessName = 'BuildX Technologies Ltd.',
    bookName,
    startDate,
    endDate,
    transactions,
    summary,
  } = options;

  const wb = XLSX.utils.book_new();

  // --- Sheet 1: Transactions Ledger ---
  const ledgerRows = transactions.map((t, idx) => {
    const isIncome = t.type === 'INCOME';
    const txDate = new Date(t.transactionDate);
    return {
      'Sl No.': idx + 1,
      'Transaction ID': t.id,
      Date: txDate.toISOString().split('T')[0],
      Time: txDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      Type: isIncome ? 'Cash In (Credit)' : 'Cash Out (Debit)',
      'Cash In (BDT)': isIncome ? t.amount : 0,
      'Cash Out (BDT)': !isIncome ? t.amount : 0,
      'Net Amount (BDT)': isIncome ? t.amount : -t.amount,
      Category: t.category,
      'Payment Mode': t.paymentMode.replace('_', ' '),
      Note: t.note || '',
      'Location Coordinates': t.locationGeo || '',
      'Voucher URL': t.voucherUrl || '',
      'UPI / RRN Ref': t.upiRefNumber || '',
      'Running Balance (BDT)': t.runningBalance !== undefined ? t.runningBalance : '',
    };
  });

  const wsLedger = XLSX.utils.json_to_sheet(ledgerRows);

  // Set column widths for readability
  wsLedger['!cols'] = [
    { wch: 8 },  // Sl No
    { wch: 18 }, // Tx ID
    { wch: 12 }, // Date
    { wch: 10 }, // Time
    { wch: 18 }, // Type
    { wch: 15 }, // Cash In
    { wch: 15 }, // Cash Out
    { wch: 16 }, // Net
    { wch: 20 }, // Category
    { wch: 16 }, // Mode
    { wch: 30 }, // Note
    { wch: 16 }, // Location
    { wch: 25 }, // Voucher
    { wch: 16 }, // Ref
    { wch: 20 }, // Running Balance
  ];

  XLSX.utils.book_append_sheet(wb, wsLedger, 'Ledger Transactions');

  // --- Sheet 2: Executive Summary ---
  const summaryRows = [
    { Field: 'Business Name', Value: businessName },
    { Field: 'Ledger Book', Value: bookName },
    { Field: 'Reporting Period', Value: `${startDate} to ${endDate}` },
    { Field: 'Export Date', Value: new Date().toLocaleString() },
    { Field: '', Value: '' },
    { Field: 'TOTAL CASH IN (BDT)', Value: summary.totalIncome },
    { Field: 'TOTAL CASH OUT (BDT)', Value: summary.totalExpense },
    { Field: 'NET BALANCE (BDT)', Value: summary.netBalance },
    { Field: 'TRANSACTION COUNT', Value: summary.transactionCount },
    { Field: '', Value: '' },
    { Field: 'Platform', Value: 'CashBook 2.0 (cashbook.buildx.bd)' },
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 26 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ledger Summary');

  const cleanName = (bookName || 'Ledger').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = customFilename || `CashBook_${cleanName}_${new Date().toISOString().split('T')[0]}.xlsx`;

  XLSX.writeFile(wb, filename);
}

export function exportToCsv(options: ExcelExportOptions, customFilename?: string) {
  const { bookName, transactions } = options;

  const headers = [
    'Sl No',
    'Transaction ID',
    'Date',
    'Type',
    'Amount (BDT)',
    'Category',
    'Payment Mode',
    'Note',
    'Voucher URL',
    'UPI RRN',
    'Running Balance (BDT)',
  ];

  const rows = transactions.map((t, idx) => [
    idx + 1,
    t.id,
    new Date(t.transactionDate).toISOString().split('T')[0],
    t.type,
    t.amount,
    `"${(t.category || '').replace(/"/g, '""')}"`,
    t.paymentMode,
    `"${(t.note || '').replace(/"/g, '""')}"`,
    t.voucherUrl || '',
    t.upiRefNumber || '',
    t.runningBalance !== undefined ? t.runningBalance : '',
  ]);

  // UTF-8 BOM for Microsoft Excel compliance
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const cleanName = (bookName || 'Ledger').replace(/[^a-zA-Z0-9_-]/g, '_');
  link.setAttribute('download', customFilename || `CashBook_${cleanName}_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
