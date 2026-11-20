import type { Metadata } from 'next';
import { auth } from '@/auth';
import { SummaryDashboard } from '@/components/dashboard/summary-dashboard';
import { localDayKey } from '@/lib/dates';

export const metadata: Metadata = {
  title: 'Özet',
  description: 'Bu ayın giderleri, bugünün rutinleri, açık görevler ve son notlar tek ekranda.',
};

export const dynamic = 'force-dynamic';

export default async function SummaryPage() {
  const session = await auth();
  const name = session?.user?.name ?? session?.user?.email?.split('@')[0] ?? '';

  return <SummaryDashboard userName={name} todayKey={localDayKey()} />;
}
