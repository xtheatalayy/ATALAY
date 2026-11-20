import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Leaf } from 'lucide-react';
import { auth } from '@/auth';
import { SignupForm } from '@/components/auth/signup-form';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';

export const metadata: Metadata = {
  title: 'Hesap oluştur',
  description: 'Planned Life hesabınızı oluşturun; verileriniz tüm cihazlarınızda sizinle gelsin.',
};

export default async function SignupPage() {
  const session = await auth();
  if (session?.user?.id) redirect('/');

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
          <h1 className="font-display text-2xl font-semibold tracking-tight">Hesap oluştur</h1>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Birkaç saniyede başlayın; verileriniz tüm cihazlarınızda sizinle gelsin.
          </p>
        </div>

        <div className="rounded-2xl bg-card p-5 shadow-lg sm:p-6">
          <SignupForm />
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Zaten hesabınız var mı?{' '}
          <Link href="/giris" className="font-medium text-primary underline-offset-4 hover:underline">
            Giriş yapın
          </Link>
        </p>
      </div>
    </div>
  );
}
