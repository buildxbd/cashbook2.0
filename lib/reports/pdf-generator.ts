import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LedgerTransaction } from '@/lib/services/ledger-service';

export interface GeneratePdfOptions {
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
  generatedBy?: string;
}

export function generateCashBookPdf(options: GeneratePdfOptions): jsPDF {
  const {
    businessName = 'BuildX Technologies Ltd.',
    bookName,
    startDate,
    endDate,
    transactions,
    summary,
    generatedBy = 'System Admin',
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  // --- 1. Header Banner ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 90, 'F');

  // Business Name & Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(businessName, margin, 38);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text(`CashBook 2.0 • Official Financial Statement`, margin, 54);

  // Document Details on Right
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`Ledger: ${bookName}`, pageWidth - margin, 36, { align: 'right' });
  doc.text(`Period: ${startDate} to ${endDate}`, pageWidth - margin, 50, { align: 'right' });
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, pageWidth - margin, 64, {
    align: 'right',
  });

  // --- 2. Summary Boxes (Cash In, Cash Out, Net Balance) ---
  const boxY = 105;
  const boxWidth = (pageWidth - margin * 2 - 20) / 3;
  const boxHeight = 52;

  // Total Cash In Box
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(187, 247, 208); // emerald-200
  doc.roundedRect(margin, boxY, boxWidth, boxHeight, 6, 6, 'FD');
  doc.setTextColor(22, 101, 52); // emerald-800
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL CASH IN (CREDIT)', margin + 10, boxY + 16);
  doc.setFontSize(14);
  doc.text(`+BDT ${summary.totalIncome.toLocaleString()}`, margin + 10, boxY + 36);

  // Total Cash Out Box
  const box2X = margin + boxWidth + 10;
  doc.setFillColor(255, 241, 242); // rose-50
  doc.setDrawColor(254, 205, 211); // rose-200
  doc.roundedRect(box2X, boxY, boxWidth, boxHeight, 6, 6, 'FD');
  doc.setTextColor(159, 18, 57); // rose-800
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL CASH OUT (DEBIT)', box2X + 10, boxY + 16);
  doc.setFontSize(14);
  doc.text(`-BDT ${summary.totalExpense.toLocaleString()}`, box2X + 10, boxY + 36);

  // Net Balance Box
  const box3X = box2X + boxWidth + 10;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.roundedRect(box3X, boxY, boxWidth, boxHeight, 6, 6, 'FD');
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('NET RUNNING BALANCE', box3X + 10, boxY + 16);
  doc.setFontSize(14);
  doc.setTextColor(summary.netBalance >= 0 ? 16 : 225, summary.netBalance >= 0 ? 185 : 29, summary.netBalance >= 0 ? 129 : 72);
  doc.text(`BDT ${summary.netBalance.toLocaleString()}`, box3X + 10, boxY + 36);

  // --- 3. Itemized Table of Transactions ---
  const tableData = transactions.map((t, idx) => {
    const isIncome = t.type === 'INCOME';
    const dateFormatted = new Date(t.transactionDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const amountFormatted = `${isIncome ? '+' : '-'}BDT ${t.amount.toLocaleString()}`;

    return [
      (idx + 1).toString(),
      dateFormatted,
      t.type === 'INCOME' ? 'Cash In' : 'Cash Out',
      amountFormatted,
      t.category,
      t.paymentMode.replace('_', ' '),
      t.note || '-',
      t.runningBalance !== undefined ? `BDT ${t.runningBalance.toLocaleString()}` : '-',
    ];
  });

  autoTable(doc, {
    startY: 175,
    margin: { left: margin, right: margin },
    head: [['#', 'Date', 'Type', 'Amount', 'Category', 'Mode', 'Note', 'Balance']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 55 },
      2: { cellWidth: 48, fontStyle: 'bold' },
      3: { cellWidth: 68, fontStyle: 'bold', halign: 'right' },
      4: { cellWidth: 70 },
      5: { cellWidth: 60 },
      6: { cellWidth: 120 },
      7: { cellWidth: 70, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      // Style Cash In green and Cash Out red in Amount and Type columns
      if (data.section === 'body' && (data.column.index === 2 || data.column.index === 3)) {
        const text = data.cell.raw as string;
        if (text.includes('Cash In') || text.includes('+')) {
          data.cell.styles.textColor = [16, 185, 129];
        } else if (text.includes('Cash Out') || text.includes('-')) {
          data.cell.styles.textColor = [225, 29, 72];
        }
      }
    },
  });

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `Generated by ${generatedBy} • CashBook 2.0 Platform (cashbook.buildx.bd)`,
      margin,
      pageHeight - 20
    );
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 20, { align: 'right' });
  }

  return doc;
}

export function downloadCashBookPdf(options: GeneratePdfOptions, filename?: string) {
  const doc = generateCashBookPdf(options);
  const cleanName = (options.bookName || 'Ledger').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeFilename = filename || `CashBook_${cleanName}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(safeFilename);
}
