'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, CalendarDays, Check, ChevronDown, ListChecks, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState, PageIntro } from '@/components/app-shell';
import { PRIORITIES } from '@/lib/categories';
import { formatDayKey, formatDateTimeTR, localDayKey, utcDayKey } from '@/lib/dates';
import { cn } from '@/lib/utils';

type TodoDto = {
  id: string;
  title: string;
  notes: string | null;
  priority: string;
  dueDate: string | null;
  reminderAt: string | null;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
};

const PRIORITY_ORDER: Record<string, number> = { high: 0, normal: 1, low: 2 };

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function TodosView({ initialTodayKey }: { initialTodayKey: string }) {
  const [todayKey, setTodayKey] = useState(initialTodayKey);
  const [todos, setTodos] = useState<TodoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quickTitle, setQuickTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<TodoDto | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formPriority, setFormPriority] = useState('normal');
  const [formDue, setFormDue] = useState('');
  const [formReminder, setFormReminder] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/todos', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { todos?: TodoDto[] };
      setTodos(Array.isArray(data?.todos) ? data.todos : []);
      setError('');
    } catch (err) {
      console.warn('[todos]', err);
      setError('Görevler yüklenemedi. Bağlantını kontrol edip tekrar dene.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setTodayKey(localDayKey());
  }, []);

  const open = useMemo(
    () =>
      todos
        .filter((todo) => !todo.completed)
        .sort((a, b) => {
          const priorityDiff = (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1);
          if (priorityDiff !== 0) return priorityDiff;
          const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
          const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
          if (aDue !== bDue) return aDue - bDue;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }),
    [todos],
  );

  const completed = useMemo(() => todos.filter((todo) => todo.completed), [todos]);

  const quickAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (quickTitle.trim().length < 2) {
      toast.error('Görev başlığı en az 2 karakter olmalı.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: quickTitle, priority: 'normal' }),
      });
      if (!res.ok) throw new Error('Görev eklenemedi.');
      setQuickTitle('');
      toast.success('Görev eklendi.');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Görev eklenemedi.');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (todo: TodoDto | null) => {
    setEditing(todo);
    setFormTitle(todo?.title ?? '');
    setFormNotes(todo?.notes ?? '');
    setFormPriority(todo?.priority ?? 'normal');
    setFormDue(todo?.dueDate ? utcDayKey(new Date(todo.dueDate)) : '');
    setFormReminder(toLocalInput(todo?.reminderAt ?? null));
    setEditOpen(true);
  };

  const saveTodo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (formTitle.trim().length < 2) {
      toast.error('Görev başlığı en az 2 karakter olmalı.');
      return;
    }
    setSaving(true);
    const payload = {
      title: formTitle,
      notes: formNotes,
      priority: formPriority,
      dueDate: formDue || null,
      reminderAt: formReminder ? new Date(formReminder).toISOString() : null,
    };
    try {
      const res = await fetch(editing ? `/api/todos/${editing.id}` : '/api/todos', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data?.error ?? 'Görev kaydedilemedi.');
      }
      toast.success(editing ? 'Görev güncellendi.' : 'Görev eklendi.');
      setEditOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Görev kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const toggleTodo = async (todo: TodoDto) => {
    setTodos((prev) => prev.map((item) => (item.id === todo.id ? { ...item, completed: !item.completed } : item)));
    try {
      const res = await fetch(`/api/todos/${todo.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ completed: !todo.completed }),
      });
      if (!res.ok) throw new Error('Görev güncellenemedi.');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Görev güncellenemedi.');
      await load();
    }
  };

  const removeTodo = async (id: string) => {
    try {
      const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Görev silinemedi.');
      toast.success('Görev silindi.');
      setConfirmId(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Görev silinemedi.');
    }
  };

  const renderTodo = (todo: TodoDto) => {
    const priority = PRIORITIES.find((item) => item.id === todo.priority) ?? PRIORITIES[1];
    const dueKey = todo.dueDate ? utcDayKey(new Date(todo.dueDate)) : null;
    const overdue = dueKey !== null && dueKey < todayKey && !todo.completed;
    return (
      <li key={todo.id} className="flex items-start gap-3 px-3 py-3">
        <button
          type="button"
          aria-label={todo.completed ? 'Geri al' : 'Tamamla'}
          onClick={() => void toggleTodo(todo)}
          className={cn(
            'mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors',
            todo.completed ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary',
          )}
        >
          {todo.completed ? <Check className="h-3.5 w-3.5" /> : null}
        </button>

        <div className="min-w-0 flex-1">
          <button type="button" onClick={() => openEdit(todo)} className="block w-full text-left">
            <p className={cn('text-sm font-medium', todo.completed ? 'text-muted-foreground line-through' : '')}>{todo.title}</p>
            {todo.notes ? <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{todo.notes}</p> : null}
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
              <span className={cn('inline-flex items-center gap-1 font-medium', priority.tone)}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" /> {priority.label}
              </span>
              {dueKey ? (
                <span className={cn('inline-flex items-center gap-1', overdue ? 'font-medium text-destructive' : 'text-muted-foreground')}>
                  <CalendarDays className="h-3 w-3" /> {formatDayKey(dueKey, { day: 'numeric', month: 'short' })}
                </span>
              ) : null}
              {todo.reminderAt ? (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Bell className="h-3 w-3" /> {formatDateTimeTR(new Date(todo.reminderAt))}
                </span>
              ) : null}
            </div>
          </button>
        </div>

        {confirmId === todo.id ? (
          <div className="flex shrink-0 items-center gap-1">
            <Button size="xs" variant="destructive" className="h-7 rounded-full px-2 text-[11px]" onClick={() => void removeTodo(todo.id)}>
              Sil
            </Button>
            <Button size="xs" variant="ghost" className="h-7 rounded-full px-2 text-[11px]" onClick={() => setConfirmId(null)}>
              Vazgeç
            </Button>
          </div>
        ) : (
          <button
            type="button"
            aria-label="Görevi sil"
            onClick={() => setConfirmId(todo.id)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </li>
    );
  };

  return (
    <div className="space-y-4">
      <PageIntro
        title="Yapılacaklar"
        description="Görevlerini öncelik ve son tarihle planla; tamamlananları ayrı tut."
        action={
          <Button size="sm" className="h-10 gap-1.5 rounded-full px-4" onClick={() => openEdit(null)}>
            <Plus className="h-4 w-4" /> Görev ekle
          </Button>
        }
      />

      <form onSubmit={quickAdd} className="flex gap-2">
        <Input
          value={quickTitle}
          onChange={(event) => setQuickTitle(event.target.value)}
          placeholder="Hızlı görev ekle…"
          className="h-11 flex-1 bg-card"
          maxLength={140}
        />
        <Button type="submit" className="h-11 w-11 shrink-0 rounded-xl p-0" disabled={saving} aria-label="Görev ekle">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-5 w-5" />}
        </Button>
      </form>

      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Açık görevler</p>
        <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">{open.length}</span>
      </div>

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
      ) : open.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Açık görev yok"
          description="Bugün yapman gerekenleri ekle; öncelik ve hatırlatma ile takip et."
          action={<Button size="sm" className="gap-1.5" onClick={() => openEdit(null)}><Plus className="h-4 w-4" /> Görev ekle</Button>}
        />
      ) : (
        <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl bg-card shadow-sm">{open.map(renderTodo)}</ul>
      )}

      {completed.length > 0 ? (
        <div>
          <button
            type="button"
            onClick={() => setShowCompleted((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-xl px-1 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            <span>Tamamlananlar ({completed.length})</span>
            <ChevronDown className={cn('h-4 w-4 transition-transform', showCompleted ? 'rotate-180' : '')} />
          </button>
          {showCompleted ? (
            <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl bg-card/70 shadow-sm">{completed.map(renderTodo)}</ul>
          ) : null}
        </div>
      ) : null}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Görevi düzenle' : 'Görev ekle'}</DialogTitle>
            <DialogDescription>Öncelik, son tarih ve hatırlatma ekleyerek planını netleştir.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveTodo} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="todo-title">Başlık</Label>
              <Input
                id="todo-title"
                autoFocus
                required
                minLength={2}
                value={formTitle}
                onChange={(event) => setFormTitle(event.target.value)}
                placeholder="ör. Su faturasını öde"
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="todo-notes">Not (isteğe bağlı)</Label>
              <Textarea
                id="todo-notes"
                value={formNotes}
                onChange={(event) => setFormNotes(event.target.value)}
                placeholder="Detaylar…"
                rows={2}
                maxLength={500}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Öncelik</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {PRIORITIES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormPriority(item.id)}
                    className={cn(
                      'rounded-xl py-2 text-xs font-semibold transition-colors',
                      formPriority === item.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent',
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="todo-due">Son tarih</Label>
                <Input id="todo-due" type="date" value={formDue} onChange={(event) => setFormDue(event.target.value)} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="todo-reminder">Hatırlatma</Label>
                <Input
                  id="todo-reminder"
                  type="datetime-local"
                  value={formReminder}
                  onChange={(event) => setFormReminder(event.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="h-11 w-full" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editing ? 'Değişiklikleri kaydet' : 'Görevi kaydet'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
