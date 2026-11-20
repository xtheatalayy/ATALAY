import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  HeartPulse,
  ListChecks,
  NotebookPen,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { auth } from '@/auth';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';

export const metadata: Metadata = {
  title: 'Planned Life — Günlük hayatını tek yerde planla',
  description:
    'Giderlerini takip et, bütçeni yönet, sağlık rutinlerini planla, görevlerini ve notlarını tek yerde tut. Yapay zeka asistanı ile günlük planını saniyeler içinde oluştur.',
  alternates: { canonical: '/' },
};

const FEATURES = [
  {
    icon: Wallet,
    title: 'Gider ve bütçe takibi',
    description: 'Günlük harcamalarını kategori kategori kaydet, aylık bütçeni belirle, kalan parayı anında gör.',
  },
  {
    icon: HeartPulse,
    title: 'Sağlık rutinleri',
    description: 'Günlük, haftalık ve aylık rutinler oluştur; su, spor, uyku gibi alışkanlıklarını seri takibiyle sürdür.',
  },
  {
    icon: ListChecks,
    title: 'Görevler ve hatırlatıcılar',
    description: 'Yapılacakları önceliklendir, tarih ve saat ver; zamanı gelen her şey için anlık hatırlatıcı al.',
  },
  {
    icon: NotebookPen,
    title: 'Notlar',
    description: 'Aklına geleni tek dokunuşla not et, offline’da bile yazmaya devam et.',
  },
  {
    icon: Bot,
    title: 'Yapay zeka asistanı',
    description: '“Bu ay nerede çok harcadım?” diye sor; bütçen, rutinlerin ve görevlerin üzerinden cevap al.',
  },
  {
    icon: ShieldCheck,
    title: 'Veriler senin',
    description: 'Hesabın sana özel; gider, not ve rutinlerin başkalarıyla paylaşılmaz.',
  },
];

const STEPS = [
  { title: 'Ücretsiz kayıt ol', description: 'E-posta ve şifreyle 30 saniyede hesabını aç.' },
  { title: 'Bütçe ve rutinlerini gir', description: 'Aylık bütçen ile günlük alışkanlıklarını tanımla.' },
  { title: 'Her gün tek ekrandan yönet', description: 'Özet ekranında bugünün tablosu, asistanında tüm cevaplar.' },
];

export default async function LandingPage() {
  const session = await auth();
  const signedIn = Boolean(session?.user?.id);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 page-glow" aria-hidden="true" />

      <header className="relative z-10">
        <div className="mx-auto flex h-16 w-full max-w-[1100px] items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="h-4 w-4" />
            </span>
            <span data-no-translate className="font-display text-[15px] font-semibold tracking-tight">
              Planned Life
            </span>
          </Link>

          <div className="flex items-center gap-1.5">
            <LanguageSwitcher />
            {signedIn ? (
              <Button asChild size="sm" className="ms-1">
                <Link href="/ozet">Uygulamaya git</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link href="/giris">Giriş yap</Link>
                </Button>
                <Button asChild size="sm" className="ms-1">
                  <Link href="/kayit">Ücretsiz başla</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[1100px] px-4 sm:px-6">
        <section className="pb-14 pt-10 text-center sm:pb-20 sm:pt-16">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Yapay zeka destekli günlük planlayıcı
          </span>
          <h1 className="mx-auto mt-5 max-w-2xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Günlük hayatını <span className="text-primary">tek yerde</span> planla
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Giderler, bütçe, sağlık rutinleri, görevler ve notlar… Dağınık uygulamalar yerine tek bir sakin
            ekran. Üstelik hepsi ücretsiz.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href={signedIn ? '/ozet' : '/kayit'}>
                {signedIn ? 'Uygulamaya git' : 'Ücretsiz başla'}
                <ArrowRight className="ms-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/giris">Hesabım var, giriş yap</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Kredi kartı yok · Reklam yok · 30 saniyede kayıt</p>
        </section>

        <section aria-labelledby="features-title" className="pb-14 sm:pb-20">
          <h2 id="features-title" className="text-center font-display text-2xl font-semibold tracking-tight">
            İhtiyacın olan her şey, fazlası yok
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Sade bir arayüz, hızlı kayıt, mobilde uygulama gibi çalışan bir deneyim.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-2xl bg-card p-5 shadow-sm">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-base font-semibold">{feature.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="steps-title" className="pb-14 sm:pb-20">
          <h2 id="steps-title" className="text-center font-display text-2xl font-semibold tracking-tight">
            Üç adımda başla
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-border/60 bg-card/70 p-5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <h3 className="mt-3 font-display text-base font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="pb-16 sm:pb-24">
          <div className="rounded-3xl bg-primary px-6 py-10 text-center text-primary-foreground shadow-lg sm:px-10">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Bugün küçük bir adım at
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm opacity-90">
              İlk giderini kaydet, ilk rutinini tamamla. Gerisi kendiliğinden düzene girer.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
                <Link href={signedIn ? '/ozet' : '/kayit'}>
                  {signedIn ? 'Uygulamaya git' : 'Ücretsiz hesap oluştur'}
                </Link>
              </Button>
              {!signedIn ? (
                <Link href="/giris" className="text-sm font-medium underline-offset-4 hover:underline">
                  Zaten hesabım var
                </Link>
              ) : null}
            </div>
            <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs opacity-90">
              <li className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Ücretsiz
              </li>
              <li className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Mobil uyumlu
              </li>
              <li className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Türkçe ve 100+ dil
              </li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/60">
        <div className="mx-auto flex w-full max-w-[1100px] flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p data-no-translate>© {new Date().getFullYear()} Planned Life</p>
          <div className="flex items-center gap-4">
            <Link href="/giris" className="hover:text-foreground">
              Giriş
            </Link>
            <Link href="/kayit" className="hover:text-foreground">
              Kayıt
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
