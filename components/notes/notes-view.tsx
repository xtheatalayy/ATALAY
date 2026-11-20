'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CloudOff, Loader2, NotebookPen, Pin, PinOff, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState, PageIntro } from '@/components/app-shell';
import { formatDayKey, utcDayKey } from '@/lib/dates';
import { cn } from '@/lib/utils';

type NoteDto = {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

const CACHE_PREFIX = 'pl_notes_cache_';
const CACHE_LAST = 'pl_notes_cache_last';

export function NotesView({ userId }: { userId: string }) {
  const cacheKey = `${CACHE_PREFIX}${userId}`;
  const [notes, setNotes] = useState<NoteDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<NoteDto | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notes', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { notes?: NoteDto[] };
      const list = Array.isArray(data?.notes) ? data.notes : [];
      setNotes(list);
      setOffline(false);
      setError('');
      try {
        const serialized = JSON.stringify({ notes: list, savedAt: new Date().toISOString() });
        window.localStorage.setItem(cacheKey, serialized);
        window.localStorage.setItem(CACHE_LAST, serialized);
      } catch {
        // storage may be full or unavailable
      }
    } catch (err) {
      console.warn('[notes]', err);
      let cached: NoteDto[] = [];
      try {
        const raw = window.localStorage.getItem(cacheKey) ?? window.localStorage.getItem(CACHE_LAST);
        if (raw) {
          const parsed = JSON.parse(raw) as { notes?: NoteDto[] };
          cached = Array.isArray(parsed?.notes) ? parsed.notes : [];
        }
      } catch {
        cached = [];
      }
      setNotes(cached);
      setOffline(true);
      setError(cached.length > 0 ? '' : 'Notlar yüklenemedi. Bağlantını kontrol edip tekrar dene.');
    } finally {
      setLoading(false);
    }
  }, [cacheKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('tr-TR');
    if (!term) return notes;
    return notes.filter(
      (note) =>
        note.title.toLocaleLowerCase('tr-TR').includes(term) ||
        note.content.toLocaleLowerCase('tr-TR').includes(term),
    );
  }, [notes, query]);

  const openEditor = (note: NoteDto | null) => {
    setEditing(note);
    setFormTitle(note?.title ?? '');
    setFormContent(note?.content ?? '');
    setEditorOpen(true);
  };

  const saveNote = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formTitle.trim() && !formContent.trim()) {
      toast.error('Başlık veya içerik girmelisin.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/notes/${editing.id}` : '/api/notes', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: formTitle, content: formContent }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data?.error ?? 'Not kaydedilemedi.');
      }
      toast.success(editing ? 'Not güncellendi.' : 'Not kaydedildi.');
      setEditorOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Not kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const togglePin = async (note: NoteDto) => {
    setNotes((prev) => prev.map((item) => (item.id === note.id ? { ...item, pinned: !item.pinned } : item)));
    try {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ pinned: !note.pinned }),
      });
      if (!res.ok) throw new Error('Not güncellenemedi.');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Not güncellenemedi.');
      await load();
    }
  };

  const removeNote = async (id: string) => {
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Not silinemedi.');
      toast.success('Not silindi.');
      setConfirmId(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Not silinemedi.');
    }
  };

  return (
    <div className="space-y-4">
      <PageIntro
        title="Notlar"
        description="Aklındakini yaz, ara ve düzenle; son notların çevrimdışı da yanında."
        action={
          <Button size="sm" className="h-10 gap-1.5 rounded-full px-4" onClick={() => openEditor(null)}>
            <Plus className="h-4 w-4" /> Yeni not
          </Button>
        }
      />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Notlarında ara…"
          className="h-11 bg-card pl-10"
        />
      </div>

      {offline ? (
        <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <CloudOff className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Çevrimdışısın — son kaydedilen notlar gösteriliyor. Bağlantı gelince otomatik güncellenir.</span>
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl bg-card py-10 text-sm text-muted-foreground shadow-sm">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Yükleniyor…
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-card p-5 text-center text-sm text-muted-foreground shadow-sm">
          {error}
          <div className="mt-3">
            <Button size="sm" variant="secondary" onClick={() => void load()}>Tekrar dene</Button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title={query ? 'Sonuç bulunamadı' : 'Henüz not yok'}
          description={query ? 'Farklı bir kelimeyle aramayı dene.' : 'İlk notunu oluştur; fikirlerini ve listelerini burada sakla.'}
          action={query ? undefined : <Button size="sm" className="gap-1.5" onClick={() => openEditor(null)}><Plus className="h-4 w-4" /> Yeni not</Button>}
        />
      ) : (
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {filtered.map((note) => (
            <li key={note.id} className="group rounded-2xl bg-card p-3.5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <button type="button" onClick={() => openEditor(note)} className="min-w-0 flex-1 text-left">
                  <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
                    {note.pinned ? <Pin className="h-3.5 w-3.5 shrink-0 text-primary" /> : null}
                    {note.title}
                  </p>
                  <p className="mt-1 line-clamp-3 whitespace-pre-line text-xs text-muted-foreground">
                    {note.content || 'İçerik yok'}
                  </p>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {formatDayKey(utcDayKey(new Date(note.updatedAt)), { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </button>
                <div className="flex shrink-0 flex-col items-center gap-1">
                  <button
                    type="button"
                    aria-label={note.pinned ? 'Sabitlemeyi kaldır' : 'Sabitle'}
                    onClick={() => void togglePin(note)}
                    className={cn(
                      'grid h-8 w-8 place-items-center rounded-full transition-colors',
                      note.pinned ? 'bg-accent text-primary' : 'text-muted-foreground hover:bg-accent',
                    )}
                  >
                    {note.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                  </button>
                  {confirmId === note.id ? (
                    <div className="flex flex-col items-center gap-1">
                      <Button size="xs" variant="destructive" className="h-7 rounded-full px-2 text-[11px]" onClick={() => void removeNote(note.id)}>
                        Sil
                      </Button>
                      <Button size="xs" variant="ghost" className="h-7 rounded-full px-2 text-[11px]" onClick={() => setConfirmId(null)}>
                        Vazgeç
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      aria-label="Notu sil"
                      onClick={() => setConfirmId(note.id)}
                      className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Notu düzenle' : 'Yeni not'}</DialogTitle>
            <DialogDescription>Başlık ve içerik ekle; istediğin zaman düzenleyebilirsin.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveNote} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="note-title">Başlık</Label>
              <Input
                id="note-title"
                autoFocus
                value={formTitle}
                onChange={(event) => setFormTitle(event.target.value)}
                placeholder="ör. Alışveriş listesi"
                className="h-11"
                maxLength={120}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note-content">İçerik</Label>
              <Textarea
                id="note-content"
                value={formContent}
                onChange={(event) => setFormContent(event.target.value)}
                placeholder="Notunu buraya yaz…"
                rows={8}
                maxLength={8000}
                className="resize-none"
              />
            </div>
            <Button type="submit" size="lg" className="h-11 w-full" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editing ? 'Değişiklikleri kaydet' : 'Notu kaydet'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
