'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowRight, HeartPulse, ListChecks, NotebookPen, Wallet } from 'lucide-react';
import { AbacusDashboard, useDashboardData } from '@/components/viz/abacus-dashboard';
import { buildSummaryManifest } from '@/lib/dashboard-manifest';
import { Skeleton } from '@/components/ui/skeleton';
import { HomeCalendar } from '@/components/dashboard/home-calendar';

const QUICK_LINKS = [
  { href: '/giderler', label: 'Gider ekle', icon: Wallet },
  { href: '/saglik', label: 'Rutin işaretle', icon: HeartPulse },
  { href: '/gorevler', label: 'Görev ekle', icon: ListChecks },
  { href: '/notlar', label: 'Not yaz', icon: NotebookPen },
];

export function SummaryDashboard({ userName, todayKey }: { userName: string; todayKey: string }) {
  const { data, dataAsOf, error } = useDashboardData('/api/dashboard', 120_000);
  const manifest = useMemo(() => buildSummaryManifest(data ?? {}, todayKey), [data, todayKey]);
  const hasData = Object.keys(data ?? {}).length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Merhaba <span className="font-medium text-foreground">{userName || 'tekrar hoş geldin'}</span>, bugünün özeti aşağıda.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <Icon className="h-3.5 w-3.5 text-primary" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>

      <HomeCalendar variant="widget" todayKey={todayKey} />

      {!hasData ? (
        error ? (
          <div className="rounded-2xl bg-card p-6 text-center shadow-sm">
            <p className="font-display text-base font-semibold">Özet yüklenemedi</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Bağlantını kontrol edip sayfayı yenile. Çevrimdışıysan notlarını görüntülemeye devam edebilirsin.
            </p>
            <Link
              href="/notlar"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Notlara git <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[0, 1, 2, 3].map((index) => (
                <Skeleton key={index} className="h-24 rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-64 rounded-2xl" />
            <div className="grid gap-3 lg:grid-cols-2">
              <Skeleton className="h-56 rounded-2xl" />
              <Skeleton className="h-56 rounded-2xl" />
            </div>
          </div>
        )
      ) : (
        <AbacusDashboard manifest={manifest} data={data} dataAsOf={dataAsOf} className="min-h-[420px]" />
      )}

      <HomeCalendar variant="full" todayKey={todayKey} />
    </div>
  );
}
