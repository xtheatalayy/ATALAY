import type { Metadata } from 'next';
import { OfflineNotes } from '@/components/offline-notes';

export const metadata: Metadata = {
  title: 'Çevrimdışı notlar',
  description: 'Bağlantı yokken son kaydedilen notlarını görüntüle.',
};

export default function OfflinePage() {
  return <OfflineNotes />;
}
