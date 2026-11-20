'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bot,
  HeartPulse,
  LayoutDashboard,
  Leaf,
  ListChecks,
  Wallet,
} from 'lucide-react';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import { InstallPrompt } from '@/components/install-prompt';
import { ReminderWatcher } from '@/components/reminder-watcher';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/ozet', label: 'Özet', icon: LayoutDashboard },
  { href: '/giderler', label: 'Giderler', icon: Wallet },
  { href: '/asistan', label: 'Asistan', icon: Bot },
  { href: '/saglik', label: 'Sağlık', icon: HeartPulse },
  { href: '/gorevler', label: 'Görevler', icon: ListChecks },
];

export type ShellUser = {
  id: string;
  name?: string | null;
  email?: string | null;
};

export function AppShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  const pathname = usePathname();

  const initials = (user?.name ?? user?.email ?? 'PL')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 page-glow" aria-hidden="true" />
      <ReminderWatcher userId={user?.id ?? ''} />

      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center justify-between gap-2 px-4 sm:px-6">
          <Link href="/ozet" className="flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-primary text-primary-foreground shadow-sm">
              <Leaf className="h-4 w-4" />
            </span>
            <span data-no-translate className="font-display text-[15px] font-semibold tracking-tight">
              Planned Life
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <InstallPrompt />
            <LanguageSwitcher />
            <Link
              href="/ayarlar"
              aria-label="Ayarlar"
              title={user?.email ?? 'Ayarlar'}
              className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-[11px] font-semibold text-secondary-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {initials || 'PL'}
            </Link>
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-[1200px] px-4 pb-28 pt-5 sm:px-6">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto grid w-full max-w-[560px] grid-cols-5 gap-0.5 px-2 pt-2 pb-[max(env(safe-area-inset-bottom),8px)]">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-medium transition-colors',
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className={cn('h-5 w-5', active ? 'text-primary' : '')} strokeWidth={active ? 2.4 : 2} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function PageIntro({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-card px-6 py-10 text-center shadow-sm">
      <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <p className="font-display text-base font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
