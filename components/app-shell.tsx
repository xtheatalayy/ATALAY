'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import {
  Bell,
  Bot,
  HeartPulse,
  LayoutDashboard,
  Leaf,
  ListChecks,
  LogOut,
  NotebookPen,
  Wallet,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import { InstallPrompt } from '@/components/install-prompt';
import { PushToggle } from '@/components/push-toggle';
import { ReminderWatcher } from '@/components/reminder-watcher';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch('/api/reminders', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as {
          routines?: { time: string | null; doneToday: boolean }[];
          todos?: { reminderAt: string | null }[];
        };
        if (!alive) return;
        const now = new Date();
        const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const routines = (data?.routines ?? []).filter((r) => r?.time && !r.doneToday && String(r.time) <= hhmm).length;
        const todos = (data?.todos ?? []).filter((t) => {
          if (!t?.reminderAt) return false;
          const when = new Date(t.reminderAt);
          return !Number.isNaN(when.getTime()) && when.getTime() <= now.getTime();
        }).length;
        setDueCount(routines + todos);
      } catch {
        // offline: keep the last known count
      }
    };
    void load();
    const id = window.setInterval(load, 120_000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [pathname]);

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
            <PushToggle />
            <Link
              href="/hatirlaticilar"
              aria-label="Hatırlatıcılar"
              className="relative grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Bell className="h-[18px] w-[18px]" />
              {dueCount > 0 ? (
                <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
                  {dueCount > 9 ? '9+' : dueCount}
                </span>
              ) : null}
            </Link>
            <LanguageSwitcher />
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Hesap menüsü"
                  className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-[11px] font-semibold text-secondary-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {initials || 'PL'}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="space-y-0.5">
                  <p className="truncate text-sm font-medium">{user?.name ?? 'Hesabım'}</p>
                  <p className="truncate text-xs font-normal text-muted-foreground">{user?.email ?? ''}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/notlar" className="cursor-pointer">
                    <NotebookPen className="mr-2 h-4 w-4" /> Notlar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/hatirlaticilar" className="cursor-pointer">
                    <Bell className="mr-2 h-4 w-4" /> Hatırlatıcılar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onSelect={() => {
                    void signOut({ redirectTo: '/giris' });
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Çıkış yap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
