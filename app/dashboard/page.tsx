import { CashBookDashboard } from '@/components/cashbook/CashBookDashboard';

export const metadata = {
  title: 'Dashboard | CashBook 2.0 Business Ledger',
  description: 'Manage multi-ledger business expenses, income vouchers, and virtual wallet limits.',
};

export default function DashboardPage() {
  return <CashBookDashboard />;
}
