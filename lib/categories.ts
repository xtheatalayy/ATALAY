export type ExpenseCategory = {
  id: string;
  label: string;
  icon: string;
  color: string;
};

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'market', label: 'Market', icon: 'cart', color: '#0F766E' },
  { id: 'yemek', label: 'Yemek', icon: 'utensils', color: '#F59E0B' },
  { id: 'ulasim', label: 'Ulaşım', icon: 'bus', color: '#3B82F6' },
  { id: 'fatura', label: 'Fatura', icon: 'receipt', color: '#8B5CF6' },
  { id: 'saglik', label: 'Sağlık', icon: 'heart', color: '#EF4444' },
  { id: 'eglence', label: 'Eğlence', icon: 'popcorn', color: '#EC4899' },
  { id: 'giyim', label: 'Giyim', icon: 'shirt', color: '#14B8A6' },
  { id: 'diger', label: 'Diğer', icon: 'ellipsis', color: '#64748B' },
];

export const CATEGORY_IDS: string[] = EXPENSE_CATEGORIES.map((c) => c.id);

export function categoryById(id: string): ExpenseCategory {
  return EXPENSE_CATEGORIES.find((c) => c.id === id) ?? EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
}

export type RoutinePeriod = 'daily' | 'weekly' | 'monthly';

export const ROUTINE_PERIODS: { id: RoutinePeriod; label: string; short: string; hint: string }[] = [
  { id: 'daily', label: 'Günlük', short: 'Gün', hint: 'Her gün yapılacak alışkanlıklar' },
  { id: 'weekly', label: 'Haftalık', short: 'Hafta', hint: 'Haftada belirli sayıda tekrar' },
  { id: 'monthly', label: 'Aylık', short: 'Ay', hint: 'Ayda belirli sayıda tekrar' },
];

export const ROUTINE_ICONS: { id: string; label: string }[] = [
  { id: 'water', label: 'Su' },
  { id: 'walk', label: 'Yürüyüş' },
  { id: 'pill', label: 'Vitamin' },
  { id: 'dumbbell', label: 'Spor' },
  { id: 'sleep', label: 'Uyku' },
  { id: 'meditate', label: 'Meditasyon' },
  { id: 'book', label: 'Okuma' },
  { id: 'sun', label: 'Güneş' },
  { id: 'sparkles', label: 'Diğer' },
];

export const PRIORITIES: { id: string; label: string; tone: string }[] = [
  { id: 'high', label: 'Yüksek', tone: 'text-rose-600 dark:text-rose-400' },
  { id: 'normal', label: 'Normal', tone: 'text-amber-600 dark:text-amber-400' },
  { id: 'low', label: 'Düşük', tone: 'text-emerald-600 dark:text-emerald-400' },
];
