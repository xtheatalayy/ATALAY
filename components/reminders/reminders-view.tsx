'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, BellRing, Check, Clock, Loader2, RefreshCw, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PageIntro } from '@/components/app-shell';
import { formatDateTimeTR } from '@/lib/dates';
import { cn } from '@/lib/utils';

type RemindersPayload = {
  today?: string;
  routines?: { id: string; title: string; period: string; time: string | null; doneToday: boolean }[];
  todos?: { id: string; title: string; priority: string; reminderAt: string | null; dueDate: string | null }[];
};

export function RemindersView() {
  const [payload, setPayload] = useState<RemindersPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reminders', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setPayload((await res.json()) as RemindersPayload);
    } catch (err) {
      console.warn('[reminders]', err);
      toast.error('Hatırlatıcılar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (typeof Notification === 'undefined') {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission);
  }, []);

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') {
      toast.error('Bu tarayıcı bildirimleri desteklemiyor.');
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        toast.success('Bildirimler açıldı.');
        const registration = await navigator.serviceWorker?.getRegistration?.();
        if (registration?.showNotification) {
          await registration.showNotification('Planned Life', {
            body: 'Bildirimler hazır. Hatırlatmaların burada görünecek.',
            icon: '/icon-192.png',
          });
        }
      } else if (result === 'denied') {
        toast.error('Bildirim izni verilmedi. Tarayıcı ayarlarından açabilirsin.');
      }
    } catch (err) {
      console.warn('[notify]', err);
      toast.error('Bildirim izni alınamadı.');
    }
  };

  const routines = payload?.routines ?? [];
  const todos = payload?.todos ?? [];
  const total = routines.length + todos.length;

  return (
    <div className="space-y-4">
      <PageIntro
        title="Hatırlatıcılar"
        description="Rutin ve görev hatırlatmalarını gör; bildirimleri açarak zamanında haberdar ol."
        action={
          <Button size="sm" variant="secondary" className="h-10 gap-1.5 rounded-full px-3" onClick={() => void load()}>
            <RefreshCw className={cn('h-4 w-4', loading ? 'animate-spin' : '')} /> Yenile
          </Button>
        }
      />

      <div className="rounded-2xl bg-card p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
            <BellRing className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Bildirimler</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {permission === 'granted'
                ? 'Açık — uygulama açıkken veya arka planda çalışırken hatırlatmalar bildirim olarak gelir.'
                : permission === 'denied'
                  ? 'Tarayıcı bildirim iznini engelledi. Adres çubuğundaki kilit simgesinden izin verebilirsin.'
                  : permission === 'unsupported'
                    ? 'Bu tarayıcı bildirimleri desteklemiyor; hatırlatmalar uygulama içinde görünür.'
                    : 'Kapalı — açmak için aşağıdaki düğmeye dokun.'}
            </p>
          </div>
        </div>
        {permission !== 'granted' && permission !== 'unsupported' ? (
          <Button className="mt-3 h-10 w-full gap-1.5" onClick={() => void requestPermission()}>
            <Bell className="h-4 w-4" /> Bildirimleri aç
          </Button>
        ) : null}
        {permission === 'granted' ? (
          <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-[11px] text-primary">
            <Check className="h-3.5 w-3.5" /> Bildirim izni verildi.
          </p>
        ) : null}
        <p className="mt-3 flex items-start gap-1.5 text-[11px] text-muted-foreground">
          <Smartphone className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          İpucu: uygulamayı ana ekranına eklediğinde bildirimler daha güvenilir çalışır.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl bg-card py-10 text-sm text-muted-foreground shadow-sm">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Yükleniyor…
        </div>
      ) : total === 0 ? (
        <div className="rounded-2xl bg-card p-6 text-center shadow-sm">
          <p className="font-display text-base font-semibold">Hatırlatıcı yok</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sağlık rutinlerine saat ekleyerek veya görevlere hatırlatma koyarak burada görebilirsin.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {routines.length > 0 ? (
            <div>
              <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rutin hatırlatmaları</p>
              <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl bg-card shadow-sm">
                {routines.map((routine) => (
                  <li key={routine.id} className="flex items-center gap-3 px-3 py-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                      <Clock className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{routine.title}</p>
                      <p className="text-[11px] text-muted-foreground">Her gün {routine.time}</p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                        routine.doneToday ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
                      )}
                    >
                      {routine.doneToday ? 'Tamamlandı' : 'Bekliyor'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {todos.length > 0 ? (
            <div>
              <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Görev hatırlatmaları</p>
              <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl bg-card shadow-sm">
                {todos.map((todo) => (
                  <li key={todo.id} className="flex items-center gap-3 px-3 py-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                      <Bell className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{todo.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {todo.reminderAt ? formatDateTimeTR(new Date(todo.reminderAt)) : '—'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
