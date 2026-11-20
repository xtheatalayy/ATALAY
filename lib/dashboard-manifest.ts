import type { VizManifest, VizRows } from '@/components/viz/abacus-dashboard';
import { formatMoney, formatMonthKey } from '@/lib/dates';

type AnyRows = Record<string, unknown>[];

function firstRow(rows: VizRows | undefined): Record<string, unknown> {
  const list = (rows ?? []) as AnyRows;
  return (list[0] ?? {}) as Record<string, unknown>;
}

function num(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function buildSummaryManifest(data: Record<string, VizRows>, todayKey: string): VizManifest {
  const expense = firstRow(data?.kpi_expense);
  const budget = firstRow(data?.kpi_budget);
  const routines = firstRow(data?.kpi_routines);
  const tasks = firstRow(data?.kpi_tasks);

  const total = num(expense?.value);
  const routineRatio = Math.round(num(routines?.value) * 100);
  const openTasks = Math.round(num(tasks?.value));
  const remaining = num(budget?.value);
  const monthLabel = formatMonthKey(todayKey.slice(0, 7));

  const headline = `Bu ay ${formatMoney(total, 0)} harcadın; bugünkü rutinlerin %${routineRatio} tamam.`;

  return {
    title: headline,
    eyebrow: `Planned Life · ${monthLabel} özeti`,
    subtitle: `${openTasks} açık görev, ${formatMoney(remaining, 0)} kalan bütçe ve son notların tek bakışta. Tüm veriler yalnızca sana ait.`,
    theme: 'app',
    sources: [{ id: 'planned_life', label: 'Planned Life · kişisel verilerin' }],
    tiles: [
      {
        id: 'kpi_expense',
        type: 'kpi',
        span: 3,
        data: 'kpi_expense',
        accent: 'accent',
        icon: 'dollar',
      },
      {
        id: 'kpi_budget',
        type: 'kpi',
        span: 3,
        data: 'kpi_budget',
        accent: 'accent-2',
        icon: 'target',
      },
      {
        id: 'kpi_routines',
        type: 'kpi',
        span: 3,
        data: 'kpi_routines',
        accent: 'accent-3',
        icon: 'heart',
      },
      {
        id: 'kpi_tasks',
        type: 'kpi',
        span: 3,
        data: 'kpi_tasks',
        accent: 'neg',
        icon: 'check',
      },
      {
        id: 'daily_spend',
        type: 'area',
        span: 8,
        data: 'monthly_spend',
        title: 'Son 6 ay harcama',
        subtitle: 'Aylık toplam (₺)',
        insight: `Son 6 ayın harcama seyri; bu ay ${formatMoney(total, 0)} ile ${total > 0 ? 'devam ediyor' : 'henüz kayıt yok'}.`,
        series: [{ field: 'tutar', label: 'Aylık harcama' }],
        x: 'x',
      },
      {
        id: 'categories',
        type: 'donut',
        span: 4,
        data: 'categories',
        title: 'Kategori dağılımı',
        subtitle: 'Bu ay · en yüksek 5 kategori',
        insight: 'Harcamanın büyük kısmı hangi kategorilerde birikiyor?',
        category: 'category',
        value: 'value',
        limit: 5,
        center_label: 'Toplam',
      },
      {
        id: 'routine_progress',
        type: 'progress',
        span: 6,
        data: 'routine_progress',
        title: 'Rutin ilerlemesi',
        subtitle: 'Her rutin için bu dönemdeki tamamlanma',
        insight: 'Hedefe en yakın rutinler üstte; eksik kalanlara bugün dokunabilirsin.',
        category: 'category',
        value: 'value',
        max: 'max',
      },
      {
        id: 'recent_notes',
        type: 'table',
        span: 6,
        data: 'recent_notes',
        title: 'Son notlar',
        subtitle: 'En son güncellenen 5 not',
        insight: 'Notlarını açıp düzenlemek için Notlar sekmesini kullan.',
        columns: [
          { field: 'baslik', label: 'Not' },
          { field: 'guncelleme', label: 'Güncelleme' },
        ],
      },
    ],
  };
}
