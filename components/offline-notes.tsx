'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CloudOff, Leaf, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDayKey, utcDayKey } from '@/lib/dates';

type CachedNote = { id: string; title: string; content: string; updatedAt: string };

export function OfflineNotes() {
  const [notes, setNotes] = useState<CachedNote[]>([]);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('pl_notes_cache_last');
      if (!raw) return;
      const parsed = JSON.parse(raw) as { notes?: CachedNote[]; savedAt?: string };
      setNotes(Array.isArray(parsed?.notes) ? parsed.notes.slice(0, 30) : []);
      setSavedAt(typeof parsed?.savedAt === 'string' ? parsed.savedAt : null);
    } catch {
      setNotes([]);
    }
  }, []);

  return (
    <div className="mx-auto w-full max-w-[560px] px-4 py-8">
      <div className="mb-5 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Leaf className="h-4 w-4" />
        </span>
        <span className="font-display text-base font-semibold tracking-tight">Planned Life</span>
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-sm">
        <p className="flex items-center gap-2 font-display text-base font-semibold">
          <CloudOff className="h-4 w-4 text-amber-600 dark:text-amber-400" /> Çevrimdışısın
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          İnternet bağlantısı yok. Son kaydedilen notların aşağıda; bağlantı gelince uygulamayı yenile.
        </p>
        <Button className="mt-3 h-10 w-full gap-1.5" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4" /> Tekrar dene
        </Button>
      </div>

      <div className="mt-4 space-y-2.5">
        {notes.length === 0 ? (
          <p className="rounded-2xl bg-card p-5 text-center text-sm text-muted-foreground shadow-sm">
            Bu cihazda kayıtlı not bulunamadı. Bağlantı kurulduğunda notların yeniden yüklenecek.
          </p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="rounded-2xl bg-card p-3.5 shadow-sm">
              <p className="text-sm font-semibold">{note.title}</p>
              <p className="mt-1 line-clamp-4 whitespace-pre-line text-xs text-muted-foreground">{note.content || 'İçerik yok'}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {formatDayKey(utcDayKey(new Date(note.updatedAt)), { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          ))
        )}
      </div>

      {savedAt ? (
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Son çevrimiçi kayıt: {formatDayKey(utcDayKey(new Date(savedAt)), { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      ) : null}

      <p className="mt-4 text-center text-xs text-muted-foreground">
        <Link href="/giris" className="font-medium text-primary underline-offset-4 hover:underline">
          Giriş ekranına dön
        </Link>
      </p>
    </div>
  );
}
