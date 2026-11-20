import type { Metadata } from 'next';
import { RemindersView } from '@/components/reminders/reminders-view';

export const metadata: Metadata = {
  title: 'Hatırlatıcılar',
  description: 'Rutin ve görev hatırlatmalarını yönet, bildirimleri aç.',
};

export const dynamic = 'force-dynamic';

export default function RemindersPage() {
  return <RemindersView />;
}
