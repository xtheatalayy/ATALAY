import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Leaf } from 'lucide-react';
import { auth } from '@/auth';
import { LoginForm } from '@/components/auth/login-form';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';

export const metadata: Metadata = {
  title: 'Giriş yap',
  description: 'Planned Life hesabınıza giriş yapın.',
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.id) redirect('/ozet');

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 page-glow" aria-hidden="true" />
      <div className="absolute end-4 top-4 z-10">
        <LanguageSwitcher className="bg-card/80 shadow-sm backdrop-blur" />
      </div>
      <div className="relative w-full max-w-[420px]">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-md">
            <Leaf className="h-6 w-6" />
          </span>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Planned Life</h1>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Giderler, sağlık rutinleri, görevler ve notlar tek yerde.
          </p>
        </div>

        <div className="rounded-2xl bg-card p-5 shadow-lg sm:p-6">
          <LoginForm />
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Devam ederek kişisel verilerinizin yalnızca bu uygulamada saklandığını kabul edersiniz.{' '}
          <Link href="/kayit" className="font-medium text-primary underline-offset-4 hover:underline">
            Hesabınız yok mu? Kayıt olun
          </Link>
        </p>
      </div>
    </div>
  );
}
