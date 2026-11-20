import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { NotesView } from '@/components/notes/notes-view';

export const metadata: Metadata = {
  title: 'Notlar',
  description: 'Başlıklı notlar oluştur, düzenle, ara ve çevrimdışı görüntüle.',
};

export const dynamic = 'force-dynamic';

export default async function NotesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/giris');

  return <NotesView userId={session.user.id} />;
}
