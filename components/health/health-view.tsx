'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Clock, Flame, HeartPulse, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState, PageIntro } from '@/components/app-shell';
import { GlyphIcon } from '@/components/glyph-icon';
import { ROUTINE_ICONS, ROUTINE_PERIODS, type RoutinePeriod } from '@/lib/categories';
import { localDayKey } from '@/lib/dates';
import { buildStats } from '@/lib/routine-stats';
import { cn } from '@/lib/utils';

type RoutineDto = {
  id: string;
  title: string;
  period: string;
  icon: string;
  target: number;
  reminderTime: string | null;
  completions: string[];
};

const PERIOD_LABEL: Record<string, string> = {
  daily: 'Günlük',
  weekly: 'Haftalık',
  monthly: 'Aylık',
};

export function HealthView({ initialTodayKey }: { initialTodayKey: string }) {
  const [todayKey, setTodayKey] = useState(initialTodayKey);
  const [routines, setRoutines] = useState<RoutineDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<RoutinePeriod>('daily');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [period, setPeriod] = useState<RoutinePeriod>('daily');
  const [icon, setIcon] = useState('water');
  const [target, setTarget] = useState('1');
  const [reminderTime, setReminderTime] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/routines', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { routines?: RoutineDto[] };
      setRoutines(Array.isArray(data?.routines) ? data.routines : []);
      setError('');
    } catch (err) {
      console.warn('[routines]', err);
      setError('Rutinler yüklenemedi. Bağlantını kontrol edip tekrar dene.');
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

  const stats = useMemo(() => routines.map((routine) => buildStats(routine, todayKey)), [routines, todayKey]);
  const visible = stats.filter((item) => item.period === tab);

  const weekStart = useMemo(() => {
    const base = new Date(`${todayKey}T00:00:00.000Z`);
    const dow = base.getUTCDay();
    base.setUTCDate(base.getUTCDate() + (dow === 0 ? -6 : 1 - dow));
    return base.toISOString().slice(0, 10);
  }, [todayKey]);

  const weekDone = stats.reduce((sum, item) => sum + item.weekDone, 0);
  const weekGoal = stats.reduce(
    (sum, item) => sum + (item.period === 'daily' ? 7 : item.period === 'weekly' ? item.periodTarget : 0),
    0,
  );
  const weekPercent = weekGoal > 0 ? Math.min(100, Math.round((weekDone / weekGoal) * 100)) : 0;
  const doneToday = stats.filter((item) => item.period === 'daily' && item.todayDone).length;
  const dailyCount = stats.filter((item) => item.period === 'daily').length;

  const openAdd = () => {
    setTitle('');
    setPeriod(tab);
    setIcon('water');
    setTarget(tab === 'daily' ? '1' : tab === 'weekly' ? '3' : '12');
    setReminderTime('');
    setAddOpen(true);
  };

  const submitRoutine = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedTarget = Number(target);
    setSaving(true);
    try {
      const res = await fetch('/api/routines', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title,
          period,
          icon,
          target: period === 'daily' ? 1 : Number.isFinite(parsedTarget) ? parsedTarget : 1,
          reminderTime: reminderTime || null,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data?.error ?? 'Rutin eklenemedi.');
      }
      toast.success('Rutin eklendi.');
      setAddOpen(false);
      setTab(period);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Rutin eklenemedi.');
    } finally {
      setSaving(false);
    }
  };

  const toggleRoutine = async (routine: RoutineDto) => {
    const isDone = routine.completions.includes(todayKey);
    const optimistic = isDone
      ? routine.completions.filter((day) => day !== todayKey)
      : [...routine.completions, todayKey];
    setRoutines((prev) => prev.map((item) => (item.id === routine.id ? { ...item, completions: optimistic } : item)));

    try {
      const res = await fetch(`/api/routines/${routine.id}/toggle`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ day: todayKey }),
      });
      if (!res.ok) throw new Error('Rutin güncellenemedi.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Rutin güncellenemedi.');
      await load();
    }
  };

  const removeRoutine = async (id: string) => {
    try {
      const res = await fetch(`/api/routines/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Rutin silinemedi.');
      toast.success('Rutin silindi.');
      setConfirmId(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Rutin silinemedi.');
    }
  };

  return (
    <div className="space-y-4">
      <PageIntro
        title="Sağlık rutini"
        description="Günlük, haftalık ve aylık alışkanlıklarını planla; serini ve tamamlama oranını takip et."
        action={
          <Button size="sm" className="h-10 gap-1.5 rounded-full px-4" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Rutin ekle
          </Button>
        }
      />

      <div className="rounded-2xl bg-card p-4 shadow-sm sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bugünkü rutinler</p>
            <p className="mt-1 font-display text-3xl font-semibold tracking-tight">
              {doneToday}
              <span className="text-lg text-muted-foreground">/{dailyCount}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bu hafta</p>
            <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-primary">%{weekPercent}</p>
          </div>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.max(2, weekPercent)}%` }} />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Bu hafta {weekDone} tamamlama · {weekStart} haftası
        </p>
      </div>

      <div className="grid grid-cols-3 gap-1.5 rounded-full bg-card p-1 shadow-sm">
        {ROUTINE_PERIODS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              'rounded-full py-2 text-xs font-semibold transition-colors',
              tab === item.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
          </button>
        ))}
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
      ) : visible.length === 0 ? (
        <EmptyState
          icon={HeartPulse}
          title={`${PERIOD_LABEL[tab]} rutin yok`}
          description={ROUTINE_PERIODS.find((item) => item.id === tab)?.hint ?? 'Yeni bir rutin ekleyerek başla.'}
          action={<Button size="sm" className="gap-1.5" onClick={openAdd}><Plus className="h-4 w-4" /> Rutin ekle</Button>}
        />
      ) : (
        <ul className="space-y-2.5">
          {visible.map((routine) => (
            <li key={routine.id} className="rounded-2xl bg-card p-3.5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <GlyphIcon name={routine.icon} className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{routine.title}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                        <span>{PERIOD_LABEL[routine.period]}</span>
                        {routine.streak > 0 ? (
                          <span className="inline-flex items-center gap-0.5 font-medium text-amber-600 dark:text-amber-400">
                            <Flame className="h-3 w-3" /> {routine.streak} seri
                          </span>
                        ) : null}
                        {routine.reminderTime ? (
                          <span className="inline-flex items-center gap-0.5">
                            <Clock className="h-3 w-3" /> {routine.reminderTime}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {confirmId === routine.id ? (
                      <div className="flex shrink-0 items-center gap-1">
                        <Button size="xs" variant="destructive" className="h-7 rounded-full px-2 text-[11px]" onClick={() => void removeRoutine(routine.id)}>
                          Sil
                        </Button>
                        <Button size="xs" variant="ghost" className="h-7 rounded-full px-2 text-[11px]" onClick={() => setConfirmId(null)}>
                          Vazgeç
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        aria-label="Rutini sil"
                        onClick={() => setConfirmId(routine.id)}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn('h-full rounded-full transition-all duration-500', routine.periodPercent >= 100 ? 'bg-primary' : 'bg-primary/70')}
                        style={{ width: `${Math.max(3, routine.periodPercent)}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                      {routine.periodDone}/{routine.periodTarget}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant={routine.todayDone ? 'secondary' : 'default'}
                className="mt-3 h-10 w-full gap-1.5"
                onClick={() => void toggleRoutine(routine)}
              >
                <Check className={cn('h-4 w-4', routine.todayDone ? 'text-primary' : '')} />
                {routine.todayDone ? 'Bugün tamamlandı — geri al' : 'Bugün tamamlandı olarak işaretle'}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Rutin ekle</DialogTitle>
            <DialogDescription>Periyodu ve hedefi seç; istersen hatırlatma saati belirle.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitRoutine} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="routine-title">Rutin adı</Label>
              <Input
                id="routine-title"
                autoFocus
                required
                minLength={2}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="ör. 2 litre su iç"
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Periyot</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {ROUTINE_PERIODS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setPeriod(item.id);
                      setTarget(item.id === 'daily' ? '1' : item.id === 'weekly' ? '3' : '12');
                    }}
                    className={cn(
                      'rounded-xl py-2 text-xs font-semibold transition-colors',
                      period === item.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent',
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Simge</Label>
              <div className="grid grid-cols-5 gap-1.5">
                {ROUTINE_ICONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={item.label}
                    onClick={() => setIcon(item.id)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-medium transition-colors',
                      icon === item.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent',
                    )}
                  >
                    <GlyphIcon name={item.id} className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="routine-target">
                  {period === 'daily' ? 'Günde' : period === 'weekly' ? 'Haftada' : 'Ayda'} kaç kez
                </Label>
                <Input
                  id="routine-target"
                  type="number"
                  min={1}
                  max={31}
                  value={target}
                  disabled={period === 'daily'}
                  onChange={(event) => setTarget(event.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="routine-time">Hatırlatma (isteğe bağlı)</Label>
                <Input
                  id="routine-time"
                  type="time"
                  value={reminderTime}
                  onChange={(event) => setReminderTime(event.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="h-11 w-full" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Rutini kaydet
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
