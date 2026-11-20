'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  ListChecks,
  Loader2,
  Target,
} from 'lucide-react';
import { addDaysToKey, addMonths, dayKeyToDate, formatMonthKey, localDayKey, monthKeyOf } from '@/lib/dates';
import { cn } from '@/lib/utils';

type GoalDto = {
  id: string;
  title: string;
  period: string;
  target: number;
  reminderTime: string | null;
  completions: string[];
};

type PlanDto = {
  id: string;
  title: string;
  priority: string;
  dueDay: string | null;
  reminderAt: string | null;
  completed: boolean;
};

type CalendarPayload = {
  month: string;
  today: string;
  goals: GoalDto[];
  plans: PlanDto[];
};

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

const PERIOD_LABEL: Record<string, string> = {
  daily: 'Günlük hedef',
  weekly: 'Haftalık hedef',
  monthly: 'Aylık hedef',
};

function buildCells(month: string): string[] {
  const first = dayKeyToDate(`${month}-01`);
  const dow = first.getUTCDay();
  const offset = dow === 0 ? 6 : dow - 1;
  const start = addDaysToKey(`${month}-01`, -offset);
  return Array.from({ length: 42 }, (_, index) => addDaysToKey(start, index));
}

function planDayOf(plan: PlanDto): string | null {
  if (plan.dueDay) return plan.dueDay;
  if (plan.reminderAt) {
    const parsed = new Date(plan.reminderAt);
    if (!Number.isNaN(parsed.getTime())) return localDayKey(parsed);
  }
  return null;
}

function humanDay(dayKey: string): string {
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    }).format(dayKeyToDate(dayKey));
  } catch {
    return dayKey;
  }
}

function timeLabel(iso: string | null): string | null {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  try {
    return new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(parsed);
  } catch {
    return null;
  }
}

function useMonthPayload(month: string) {
  const [data, setData] = useState<CalendarPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    fetch(`/api/calendar?month=${month}`, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as CalendarPayload;
      })
      .then((payload) => {
        if (alive) setData(payload);
      })
      .catch(() => {
        if (alive) setError('Takvim yüklenemedi. Bağlantını kontrol edip tekrar dene.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [month]);

  return { data, loading, error };
}

function MonthGrid({
  month,
  today,
  selected,
  compact,
  dailyGoalCount,
  plansByDay,
  goalsByDay,
  onSelect,
}: {
  month: string;
  today: string;
  selected: string;
  compact?: boolean;
  dailyGoalCount: number;
  plansByDay: Map<string, PlanDto[]>;
  goalsByDay: Map<string, GoalDto[]>;
  onSelect: (day: string) => void;
}) {
  const cells = useMemo(() => buildCells(month), [month]);

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 pb-1 text-center text-[10px] font-medium text-muted-foreground">
        {WEEKDAYS.map((day) => (
          <span key={day}>{compact ? day.slice(0, 1) : day}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day) => {
          const inMonth = day.startsWith(month);
          const isToday = day === today;
          const isSelected = day === selected;
          const doneGoals = (goalsByDay.get(day) ?? []).length;
          const hasGoal = inMonth && (doneGoals > 0 || dailyGoalCount > 0);
          const dayPlans = plansByDay.get(day) ?? [];
          const openPlan = dayPlans.some((plan) => !plan.completed);

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelect(day)}
              aria-label={`${humanDay(day)}${hasGoal ? `, ${dailyGoalCount} hedef` : ''}${dayPlans.length ? `, ${dayPlans.length} plan` : ''}`}
              aria-pressed={isSelected}
              className={cn(
                'relative flex flex-col items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                compact ? 'h-9 text-xs' : 'h-11 text-sm',
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : inMonth
                    ? 'hover:bg-accent'
                    : 'text-muted-foreground/40',
                !isSelected && isToday ? 'ring-1 ring-inset ring-primary/50' : '',
              )}
            >
              <span className={cn('leading-none', !inMonth && 'opacity-50')}>{Number(day.slice(8, 10))}</span>
              <span className="mt-1 flex h-1.5 items-center gap-0.5">
                {hasGoal ? (
                  <span
                    className={cn(
                      'h-1 w-1 rounded-full',
                      isSelected ? 'bg-primary-foreground' : doneGoals > 0 ? 'bg-primary' : 'bg-primary/40',
                    )}
                  />
                ) : null}
                {dayPlans.length > 0 ? (
                  <span
                    className={cn(
                      'h-1 w-1 rounded-full',
                      isSelected ? 'bg-primary-foreground/70' : openPlan ? 'bg-chart-2' : 'bg-muted-foreground/40',
                    )}
                  />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Hedef
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-chart-2" /> Plan
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" /> Tamamlanan
        </span>
      </div>
    </div>
  );
}

function GoalRow({ goal, done, showPeriod }: { goal: GoalDto; done: boolean; showPeriod?: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={cn(
          'grid h-6 w-6 shrink-0 place-items-center rounded-full',
          done ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
        )}
      >
        {done ? <Check className="h-3 w-3" /> : <Target className="h-3 w-3" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm', done && 'text-muted-foreground line-through')}>{goal.title}</p>
        <p className="truncate text-[10px] text-muted-foreground">
          {showPeriod ? PERIOD_LABEL[goal.period] ?? 'Hedef' : goal.reminderTime ? `Saat ${goal.reminderTime}` : 'Günlük hedef'}
        </p>
      </div>
    </li>
  );
}

function PlanRow({ plan, showDate }: { plan: PlanDto; showDate?: boolean }) {
  const time = timeLabel(plan.reminderAt);
  return (
    <li className="flex items-center gap-2">
      <span
        className={cn(
          'grid h-6 w-6 shrink-0 place-items-center rounded-full',
          plan.completed ? 'bg-primary/15 text-primary' : 'bg-chart-2/15 text-chart-2',
        )}
      >
        {plan.completed ? <Check className="h-3 w-3" /> : <ListChecks className="h-3 w-3" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm', plan.completed && 'text-muted-foreground line-through')}>{plan.title}</p>
        <p className="flex items-center gap-1 truncate text-[10px] text-muted-foreground">
          {plan.reminderAt ? <Clock className="h-2.5 w-2.5" /> : null}
          {plan.reminderAt ? time : null}
          {plan.reminderAt && showDate ? ' · ' : null}
          {showDate && plan.dueDay ? humanDay(plan.dueDay) : null}
          {!plan.reminderAt && !plan.dueDay ? 'Plan' : null}
        </p>
      </div>
    </li>
  );
}

function MonthNav({
  month,
  onChange,
  showToday,
  onToday,
}: {
  month: string;
  onChange: (next: string) => void;
  showToday?: boolean;
  onToday?: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {showToday ? (
        <button
          type="button"
          onClick={onToday}
          className="mr-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          Bugün
        </button>
      ) : null}
      <button
        type="button"
        aria-label="Önceki ay"
        onClick={() => onChange(addMonths(month, -1))}
        className="grid h-7 w-7 place-items-center rounded-md transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[92px] text-center text-xs font-semibold">{formatMonthKey(month)}</span>
      <button
        type="button"
        aria-label="Sonraki ay"
        onClick={() => onChange(addMonths(month, 1))}
        className="grid h-7 w-7 place-items-center rounded-md transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export function HomeCalendar({
  todayKey,
  variant = 'full',
}: {
  todayKey: string;
  variant?: 'widget' | 'full';
}) {
  const isWidget = variant === 'widget';
  const [month, setMonth] = useState(() => monthKeyOf(todayKey));
  const [selected, setSelected] = useState(todayKey);
  const { data, loading, error } = useMonthPayload(month);

  useEffect(() => {
    if (!selected.startsWith(month)) {
      setSelected(month === monthKeyOf(todayKey) ? todayKey : `${month}-01`);
    }
  }, [month, selected, todayKey]);

  const goals = data?.goals;
  const plans = data?.plans;

  const dailyGoals = useMemo(() => (goals ?? []).filter((goal) => goal.period === 'daily'), [goals]);

  const goalsByDay = useMemo(() => {
    const map = new Map<string, GoalDto[]>();
    for (const goal of goals ?? []) {
      for (const day of goal.completions) {
        const list = map.get(day);
        if (list) list.push(goal);
        else map.set(day, [goal]);
      }
    }
    return map;
  }, [goals]);

  const plansByDay = useMemo(() => {
    const map = new Map<string, PlanDto[]>();
    for (const plan of plans ?? []) {
      const day = planDayOf(plan);
      if (!day) continue;
      const list = map.get(day);
      if (list) list.push(plan);
      else map.set(day, [plan]);
    }
    return map;
  }, [plans]);

  const selectedPlans = plansByDay.get(selected) ?? [];
  const selectedGoals = useMemo(() => {
    const completedOthers = (goals ?? []).filter(
      (goal) => goal.period !== 'daily' && goal.completions.includes(selected),
    );
    return [...dailyGoals, ...completedOthers].sort(
      (a, b) => Number(a.completions.includes(selected)) - Number(b.completions.includes(selected)),
    );
  }, [goals, dailyGoals, selected]);

  const doneGoalCount = selectedGoals.filter((goal) => goal.completions.includes(selected)).length;
  const openPlanCount = selectedPlans.filter((plan) => !plan.completed).length;

  const selectDay = (day: string) => {
    if (!day.startsWith(month)) setMonth(monthKeyOf(day));
    setSelected(day);
  };

  const goToday = () => {
    const currentMonth = monthKeyOf(todayKey);
    setMonth(currentMonth);
    setSelected(todayKey);
  };

  const visibleGoals = isWidget ? selectedGoals.slice(0, 3) : selectedGoals;
  const visiblePlans = isWidget ? selectedPlans.slice(0, 3) : selectedPlans;

  return (
    <section className="rounded-2xl bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-foreground">
            <CalendarDays className="h-4 w-4" />
          </span>
          <div>
            <p className="font-display text-sm font-semibold">Takvim</p>
            <p className="text-[11px] text-muted-foreground">
              {isWidget ? 'Bugünün hedefleri ve planları' : 'Hedeflerin ve planların aylık görünümü'}
            </p>
          </div>
        </div>
        <MonthNav month={month} onChange={setMonth} showToday={!isWidget} onToday={goToday} />
      </div>

      {error ? (
        <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
      ) : loading && !data ? (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-muted/40 py-10 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Takvim yükleniyor…
        </div>
      ) : (
        <div
          className={cn(
            'mt-4 grid gap-4',
            isWidget ? 'sm:grid-cols-[minmax(0,280px)_1fr] sm:items-start' : 'lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start',
          )}
        >
          <MonthGrid
            month={month}
            today={todayKey}
            selected={selected}
            compact={isWidget}
            dailyGoalCount={dailyGoals.length}
            plansByDay={plansByDay}
            goalsByDay={goalsByDay}
            onSelect={selectDay}
          />

          <div
            className={cn(
              'min-w-0 rounded-xl border border-border/60 bg-muted/30 p-3',
              !isWidget && 'sm:p-4',
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-1">
              <p className="text-xs font-semibold first-letter:uppercase">{humanDay(selected)}</p>
              <p className="text-[10px] text-muted-foreground">
                {doneGoalCount}/{selectedGoals.length} hedef · {openPlanCount} açık plan
              </p>
            </div>

            <div className={cn('mt-3 space-y-3', isWidget && 'mt-2 space-y-2')}>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Hedefler</p>
                  {!isWidget ? (
                    <Link href="/saglik" className="text-[10px] font-medium text-primary hover:underline">
                      Sağlık
                    </Link>
                  ) : null}
                </div>
                {visibleGoals.length > 0 ? (
                  <ul className="mt-1 space-y-1.5">
                    {visibleGoals.map((goal) => (
                      <GoalRow
                        key={goal.id}
                        goal={goal}
                        done={goal.completions.includes(selected)}
                        showPeriod={goal.period !== 'daily'}
                      />
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-[11px] text-muted-foreground">Bu gün için hedef yok.</p>
                )}
                {isWidget && selectedGoals.length > visibleGoals.length ? (
                  <p className="mt-1 text-[10px] text-muted-foreground">+{selectedGoals.length - visibleGoals.length} hedef daha</p>
                ) : null}
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Planlar</p>
                  {!isWidget ? (
                    <Link href="/gorevler" className="text-[10px] font-medium text-primary hover:underline">
                      Görevler
                    </Link>
                  ) : null}
                </div>
                {visiblePlans.length > 0 ? (
                  <ul className="mt-1 space-y-1.5">
                    {visiblePlans.map((plan) => (
                      <PlanRow key={plan.id} plan={plan} />
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-[11px] text-muted-foreground">Bu gün için plan yok.</p>
                )}
                {isWidget && selectedPlans.length > visiblePlans.length ? (
                  <p className="mt-1 text-[10px] text-muted-foreground">+{selectedPlans.length - visiblePlans.length} plan daha</p>
                ) : null}
              </div>
            </div>

            {isWidget ? (
              <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-medium">
                <Link href="/saglik" className="rounded-full bg-card px-2 py-1 text-foreground shadow-sm hover:bg-accent">
                  Hedef ekle
                </Link>
                <Link href="/gorevler" className="rounded-full bg-card px-2 py-1 text-foreground shadow-sm hover:bg-accent">
                  Plan ekle
                </Link>
              </div>
            ) : (
              <p className="mt-3 border-t border-border/60 pt-2 text-[10px] leading-relaxed text-muted-foreground">
                Hedefler sağlık rutinlerini, planlar görevlerin tarihlerini gösterir.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
