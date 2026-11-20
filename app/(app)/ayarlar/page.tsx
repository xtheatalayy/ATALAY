import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { SettingsView } from '@/components/settings/settings-view';

export const metadata: Metadata = {
  title: 'Ayarlar',
  description: 'Bildirim zil sesini ve ses düzeyini seç, uygulama tercihlerini yönet.',
};

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/giris');

  return <SettingsView name={session.user.name ?? null} email={session.user.email ?? null} />;
}
