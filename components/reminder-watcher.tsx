'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

type ReminderPayload = {
  today?: string;
  routines?: { id: string; title: string; period: string; time: string | null; doneToday: boolean }[];
  todos?: { id: string; title: string; priority: string; reminderAt: string | null; dueDate: string | null }[];
};

async function showNotification(title: string, body: string) {
  toast(title, { description: body });
  try {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const registration = await navigator.serviceWorker?.getRegistration?.();
    if (registration?.showNotification) {
      await registration.showNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: `${title}-${body}`.slice(0, 60),
        data: { url: '/' },
      });
    } else {
      new Notification(title, { body, icon: '/icon-192.png' });
    }
  } catch (error) {
    console.warn('[notify]', error);
  }
}

/** Checks due reminders while the app is open and raises a notification once per item. */
export function ReminderWatcher({ userId }: { userId: string }) {
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;
    let alive = true;

    const check = async () => {
      try {
        const res = await fetch('/api/reminders', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as ReminderPayload;
        if (!alive) return;

        const now = new Date();
        const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const today = data?.today ?? '';
        const items: { key: string; title: string; body: string }[] = [];

        for (const routine of data?.routines ?? []) {
          if (!routine?.time || routine.doneToday) continue;
          if (String(routine.time) <= hhmm) {
            items.push({
              key: `r-${routine.id}-${today}`,
              title: 'Rutin zamanı',
              body: `${routine.title} bugün henüz işaretlenmedi.`,
            });
          }
        }

        for (const todo of data?.todos ?? []) {
          if (!todo?.reminderAt) continue;
          const when = new Date(todo.reminderAt);
          if (Number.isNaN(when.getTime()) || when.getTime() > now.getTime()) continue;
          items.push({ key: `t-${todo.id}-${todo.reminderAt}`, title: 'Görev hatırlatması', body: todo.title });
        }

        for (const item of items) {
          if (seen.current.has(item.key)) continue;
          const storageKey = `pl_notified_${userId}_${item.key}`;
          try {
            if (window.localStorage.getItem(storageKey)) {
              seen.current.add(item.key);
              continue;
            }
            window.localStorage.setItem(storageKey, '1');
          } catch {
            // storage may be unavailable in private mode
          }
          seen.current.add(item.key);
          await showNotification(item.title, item.body);
        }
      } catch (error) {
        console.warn('[reminders]', error);
      }
    };

    void check();
    const interval = window.setInterval(check, 60_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void check();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      alive = false;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [userId]);

  return null;
}
