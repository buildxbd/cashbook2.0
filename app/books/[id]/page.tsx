import { CashBookDashboard } from '@/components/cashbook/CashBookDashboard';

export const runtime = 'edge';

export const metadata = {
  title: 'Ledger View | CashBook 2.0',
  description: 'View individual ledger cash in and cash out transactions.',
};

interface BookPageProps {
  params: {
    id: string;
  };
}

export default function BookViewPage({ params }: BookPageProps) {
  return <CashBookDashboard initialBookId={params.id} />;
}
