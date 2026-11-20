export const TR_LOCALE = 'tr-TR';

const pad = (n: number): string => String(n).padStart(2, '0');

/** Local calendar day of a Date, as YYYY-MM-DD. */
export function localDayKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** UTC calendar day of a Date, as YYYY-MM-DD (stored dates are UTC midnight). */
export function utcDayKey(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** YYYY-MM-DD -> Date at UTC midnight. */
export function dayKeyToDate(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

export function isValidDayKey(key: unknown): key is string {
  return typeof key === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(key);
}

export function monthKeyOf(dayKey: string): string {
  return dayKey.slice(0, 7);
}

export function currentMonthKey(): string {
  return localDayKey().slice(0, 7);
}

export function isValidMonthKey(key: unknown): key is string {
  return typeof key === 'string' && /^\d{4}-\d{2}$/.test(key);
}

/** UTC bounds of a YYYY-MM month. */
export function monthBounds(month: string): { start: Date; end: Date } {
  const [y, m] = month.split('-').map((v) => Number(v));
  const start = new Date(Date.UTC(y, (m || 1) - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(y, m || 1, 1, 0, 0, 0, 0));
  return { start, end };
}

export function addMonths(month: string, delta: number): string {
  const [y, m] = month.split('-').map((v) => Number(v));
  const d = new Date(Date.UTC(y, (m || 1) - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

export function addDaysToKey(key: string, delta: number): string {
  const d = dayKeyToDate(key);
  d.setUTCDate(d.getUTCDate() + delta);
  return utcDayKey(d);
}

/** Monday-based start of the week containing `key`. */
export function startOfWeekKey(key: string): string {
  const d = dayKeyToDate(key);
  const dow = d.getUTCDay(); // 0 = Sunday
  const diff = dow === 0 ? -6 : 1 - dow;
  return addDaysToKey(key, diff);
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map((v) => Number(v));
  return new Date(Date.UTC(y, m || 1, 0)).getUTCDate();
}

export function formatDayKey(key: string, options?: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat(TR_LOCALE, {
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
      ...(options ?? {}),
    }).format(dayKeyToDate(key));
  } catch {
    return key;
  }
}

export function formatMonthKey(month: string, options?: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat(TR_LOCALE, {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
      ...(options ?? {}),
    }).format(dayKeyToDate(`${month}-01`));
  } catch {
    return month;
  }
}

export function formatMoney(value: number, fractionDigits = 2): string {
  const safe = Number.isFinite(value) ? value : 0;
  try {
    return new Intl.NumberFormat(TR_LOCALE, {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: fractionDigits,
    }).format(safe);
  } catch {
    return `${safe.toFixed(fractionDigits)} TL`;
  }
}

export function formatNumber(value: number, fractionDigits = 0): string {
  const safe = Number.isFinite(value) ? value : 0;
  try {
    return new Intl.NumberFormat(TR_LOCALE, {
      minimumFractionDigits: 0,
      maximumFractionDigits: fractionDigits,
    }).format(safe);
  } catch {
    return String(safe);
  }
}

/** "14:30" style local time of a Date. */
export function formatClock(date: Date): string {
  try {
    return new Intl.DateTimeFormat(TR_LOCALE, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    }).format(date);
  } catch {
    return '';
  }
}

export function formatDateTimeTR(date: Date): string {
  try {
    return new Intl.DateTimeFormat(TR_LOCALE, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    }).format(date);
  } catch {
    return '';
  }
}
