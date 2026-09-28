import { CashBookDashboard } from '@/components/cashbook/CashBookDashboard';

export const metadata = {
  title: 'CashBook 2.0 | Multi-Ledger Business Expense & Cash In/Out Platform',
  description: 'Enterprise Multi-Ledger CashBook and UPI/MFS Native Expense Platform for businesses.',
};

export default function HomePage() {
  return <CashBookDashboard />;
}
