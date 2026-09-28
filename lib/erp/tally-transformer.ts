import { LedgerTransaction } from '@/lib/services/ledger-service';

/**
 * Escapes reserved XML characters to ensure valid Tally Prime XML schema
 */
function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Formats a Date into Tally's expected YYYYMMDD format
 */
function formatTallyDate(dateVal: Date | string): string {
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  }
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

/**
 * Formats a Date into standard readable ISO YYYY-MM-DD
 */
function formatISODate(dateVal: Date | string): string {
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
  return d.toISOString().split('T')[0];
}

/**
 * Generates Tally Prime compliant XML string for accounting voucher import
 */
export function generateTallyPrimeXML(
  transactions: LedgerTransaction[],
  companyName: string = 'CashBook 2.0 Business'
): string {
  const vouchersXml = transactions
    .map((tx) => {
      const isExpense = tx.type === 'EXPENSE';
      const voucherType = isExpense ? 'Payment' : 'Receipt';
      const tallyDate = formatTallyDate(tx.transactionDate);
      const amountVal = Number(tx.amount).toFixed(2);
      const voucherNumber = escapeXml(tx.id.substring(0, 12).toUpperCase());

      // Account ledgers based on payment mode
      const cashOrBankLedger =
        tx.paymentMode === 'VIRTUAL_WALLET' ? 'Bank Accounts' : 'Cash';
      const categoryLedger = escapeXml(tx.category || (isExpense ? 'General Expenses' : 'Sales Revenue'));

      const narration = escapeXml(
        `${tx.note ? `${tx.note} - ` : ''}Category: ${tx.category} [Mode: ${tx.paymentMode}]${
          tx.upiRefNumber ? ` (Ref: ${tx.upiRefNumber})` : ''
        }`
      );

      // In Tally XML:
      // For Payment (Expense):
      // - Expense ledger is debited (amount is -amount, ISDEEMEDPOSITIVE = Yes)
      // - Cash/Bank ledger is credited (amount is +amount, ISDEEMEDPOSITIVE = No)
      //
      // For Receipt (Income):
      // - Cash/Bank ledger is debited (amount is -amount, ISDEEMEDPOSITIVE = Yes)
      // - Income ledger is credited (amount is +amount, ISDEEMEDPOSITIVE = No)

      if (isExpense) {
        return `        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="${voucherType}" ACTION="Create" OBJVIEW="Accounting Voucher View">
            <DATE>${tallyDate}</DATE>
            <EFFECTIVEDATE>${tallyDate}</EFFECTIVEDATE>
            <VOUCHERTYPENAME>${voucherType}</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${voucherNumber}</VOUCHERNUMBER>
            <NARRATION>${narration}</NARRATION>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${categoryLedger}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${amountVal}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${cashOrBankLedger}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${amountVal}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>`;
      } else {
        return `        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="${voucherType}" ACTION="Create" OBJVIEW="Accounting Voucher View">
            <DATE>${tallyDate}</DATE>
            <EFFECTIVEDATE>${tallyDate}</EFFECTIVEDATE>
            <VOUCHERTYPENAME>${voucherType}</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${voucherNumber}</VOUCHERNUMBER>
            <NARRATION>${narration}</NARRATION>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${cashOrBankLedger}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${amountVal}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${categoryLedger}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${amountVal}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>`;
      }
    })
    .join('\n');

  return `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${escapeXml(companyName)}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
${vouchersXml}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

/**
 * Generates an Accounting ERP compatible CSV format (QuickBooks, Zoho, Busy, ERPNext, Tally CSV)
 */
export function generateAccountingCSV(transactions: LedgerTransaction[]): string {
  const headers = [
    'Date',
    'Voucher No',
    'Voucher Type',
    'Debit Ledger',
    'Credit Ledger',
    'Amount',
    'Category',
    'Payment Mode',
    'Reference No',
    'Narration',
  ];

  const rows = transactions.map((tx) => {
    const isExpense = tx.type === 'EXPENSE';
    const voucherType = isExpense ? 'Payment' : 'Receipt';
    const dateStr = formatISODate(tx.transactionDate);
    const amountStr = Number(tx.amount).toFixed(2);
    const voucherNo = tx.id.substring(0, 10).toUpperCase();

    const cashOrBank = tx.paymentMode === 'VIRTUAL_WALLET' ? 'Bank Accounts' : 'Cash-in-Hand';
    const debitLedger = isExpense ? tx.category : cashOrBank;
    const creditLedger = isExpense ? cashOrBank : tx.category;

    const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`;

    return [
      dateStr,
      voucherNo,
      voucherType,
      escapeCsv(debitLedger),
      escapeCsv(creditLedger),
      amountStr,
      escapeCsv(tx.category || 'General'),
      tx.paymentMode,
      escapeCsv(tx.upiRefNumber || ''),
      escapeCsv(tx.note || ''),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
