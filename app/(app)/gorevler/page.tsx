import type { Metadata } from 'next';
import { TodosView } from '@/components/todos/todos-view';
import { localDayKey } from '@/lib/dates';

export const metadata: Metadata = {
  title: 'Yapılacaklar',
  description: 'Görevlerini öncelik ve son tarihle planla, tamamlananları ayrı gör.',
};

export const dynamic = 'force-dynamic';

export default function TodosPage() {
  return <TodosView initialTodayKey={localDayKey()} />;
}
