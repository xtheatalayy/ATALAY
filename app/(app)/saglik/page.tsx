import type { Metadata } from 'next';
import { HealthView } from '@/components/health/health-view';
import { localDayKey } from '@/lib/dates';

export const metadata: Metadata = {
  title: 'Sağlık rutini',
  description: 'Günlük, haftalık ve aylık sağlık rutinlerini planla, tamamla ve serini takip et.',
};

export const dynamic = 'force-dynamic';

export default function HealthPage() {
  return <HealthView initialTodayKey={localDayKey()} />;
}
