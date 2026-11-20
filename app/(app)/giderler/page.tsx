import type { Metadata } from 'next';
import { ExpensesView } from '@/components/expenses/expenses-view';
import { localDayKey } from '@/lib/dates';

export const metadata: Metadata = {
  title: 'Giderler',
  description: 'Harcamalarını kaydet, kategori bazında incele, bütçeni ve hesap makinesini kullan.',
};

export const dynamic = 'force-dynamic';

export default function ExpensesPage() {
  return <ExpensesView initialTodayKey={localDayKey()} />;
}
