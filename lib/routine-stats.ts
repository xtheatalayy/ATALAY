import { addDaysToKey, daysInMonth, localDayKey, monthKeyOf, startOfWeekKey, utcDayKey } from '@/lib/dates';

export type RoutinePeriod = 'daily' | 'weekly' | 'monthly';

export type RoutineInput = {
  id: string;
  title: string;
  period: string;
  icon: string;
  target: number;
  reminderTime: string | null;
  completions: string[];
};

export type RoutineStats = RoutineInput & {
  todayDone: boolean;
  periodDone: number;
  periodTarget: number;
  periodPercent: number;
  streak: number;
  weekDone: number;
  monthDone: number;
  totalDone: number;
};

export function normalizePeriod(period: string): RoutinePeriod {
  if (period === 'weekly' || period === 'monthly') return period;
  return 'daily';
}

export function periodTarget(period: string, target: number): number {
  const safe = Number.isFinite(target) && target > 0 ? Math.round(target) : 1;
  return safe;
}

/** Days of the current period (day / week / month) that contain a completion. */
export function countInCurrentPeriod(completions: string[], period: string, todayKey: string): number {
  const set = new Set(completions ?? []);
  if (period === 'weekly') {
    const start = startOfWeekKey(todayKey);
    let count = 0;
    for (let i = 0; i < 7; i += 1) {
      if (set.has(addDaysToKey(start, i))) count += 1;
    }
    return count;
  }
  if (period === 'monthly') {
    const month = monthKeyOf(todayKey);
    return completions.filter((c) => c.startsWith(month)).length;
  }
  return set.has(todayKey) ? 1 : 0;
}

function periodKeyOf(dayKey: string, period: RoutinePeriod): string {
  if (period === 'weekly') return startOfWeekKey(dayKey);
  if (period === 'monthly') return monthKeyOf(dayKey);
  return dayKey;
}

function previousPeriodKey(key: string, period: RoutinePeriod): string {
  if (period === 'weekly') return addDaysToKey(key, -7);
  if (period === 'monthly') {
    const [y, m] = key.split('-').map((v) => Number(v));
    const d = new Date(Date.UTC(y, (m || 1) - 2, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  }
  return addDaysToKey(key, -1);
}

/** Consecutive completed periods ending at the current (or previous) period. */
export function computeStreak(completions: string[], period: string, target: number, todayKey: string): number {
  const p = normalizePeriod(period);
  const goal = periodTarget(p, target);
  const counts = new Map<string, number>();
  for (const day of completions ?? []) {
    const key = periodKeyOf(day, p);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  let cursor = periodKeyOf(todayKey, p);
  let streak = 0;
  // the current period only counts once it has reached its goal; otherwise start from the previous one
  if ((counts.get(cursor) ?? 0) < goal) {
    cursor = previousPeriodKey(cursor, p);
  }
  for (let i = 0; i < 400; i += 1) {
    if ((counts.get(cursor) ?? 0) >= goal) {
      streak += 1;
      cursor = previousPeriodKey(cursor, p);
    } else {
      break;
    }
  }
  return streak;
}

export function buildStats(routine: RoutineInput, todayKey: string): RoutineStats {
  const period = normalizePeriod(routine.period);
  const completions = Array.isArray(routine.completions) ? routine.completions : [];
  const target = periodTarget(period, routine.target);
  const periodDone = countInCurrentPeriod(completions, period, todayKey);
  const weekStart = startOfWeekKey(todayKey);
  const weekDone = completions.filter((c) => c >= weekStart && c <= addDaysToKey(weekStart, 6)).length;
  const month = monthKeyOf(todayKey);
  const monthDone = completions.filter((c) => c.startsWith(month)).length;
  const percent = target > 0 ? Math.min(100, Math.round((periodDone / target) * 100)) : 0;

  return {
    ...routine,
    period,
    target,
    todayDone: completions.includes(todayKey),
    periodDone,
    periodTarget: target,
    periodPercent: percent,
    streak: computeStreak(completions, period, target, todayKey),
    weekDone,
    monthDone,
    totalDone: completions.length,
  };
}

export function monthDayCount(month: string): number {
  return daysInMonth(month);
}

export function todayKeySafe(): string {
  return localDayKey(new Date());
}

export function dayKeysFromDates(dates: Date[]): string[] {
  return (dates ?? []).map((d) => utcDayKey(d));
}
