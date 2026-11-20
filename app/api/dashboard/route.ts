import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { categoryById } from '@/lib/categories';
import {
  addDaysToKey,
  addMonths,
  currentMonthKey,
  daysInMonth,
  localDayKey,
  monthBounds,
  monthKeyOf,
  startOfWeekKey,
  utcDayKey,
} from '@/lib/dates';
import { buildStats, type RoutineInput } from '@/lib/routine-stats';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  try {
    const todayKey = localDayKey();
    const month = monthKeyOf(todayKey);
    const { start, end } = monthBounds(month);
    const prevMonth = addMonths(month, -1);
    const prevBounds = monthBounds(prevMonth);

    const [monthExpenses, prevExpenses, budget, routines, openTodos, completedToday, recentNotes, lastMonths] =
      await Promise.all([
        prisma.expense.findMany({
          where: { userId, date: { gte: start, lt: end } },
          select: { amount: true, category: true, date: true },
        }),
        prisma.expense.aggregate({
          where: { userId, date: { gte: prevBounds.start, lt: prevBounds.end } },
          _sum: { amount: true },
        }),
        prisma.budget.findUnique({ where: { userId_month: { userId, month } }, select: { amount: true } }),
        prisma.routine.findMany({
          where: { userId, active: true },
          select: {
            id: true,
            title: true,
            period: true,
            icon: true,
            target: true,
            reminderTime: true,
            completions: { where: { date: { gte: new Date(`${addDaysToKey(todayKey, -120)}T00:00:00.000Z`) } }, select: { date: true } },
          },
        }),
        prisma.todo.count({ where: { userId, completed: false } }),
        prisma.todo.count({
          where: { userId, completed: true, completedAt: { gte: new Date(`${todayKey}T00:00:00.000Z`) } },
        }),
        prisma.note.findMany({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          take: 5,
          select: { id: true, title: true, updatedAt: true },
        }),
        prisma.expense.findMany({
          where: { userId, date: { gte: monthBounds(addMonths(month, -5)).start, lt: end } },
          select: { amount: true, date: true },
        }),
      ]);

    const total = monthExpenses.reduce((sum, item) => sum + item.amount, 0);
    const prevTotal = prevExpenses._sum.amount ?? 0;
    const deltaPct = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 1000) / 10 : null;

    // daily spend series (current month, up to today)
    const dailyMap = new Map<string, number>();
    for (const item of monthExpenses) {
      const key = utcDayKey(item.date);
      dailyMap.set(key, (dailyMap.get(key) ?? 0) + item.amount);
    }
    const dayCount = Math.min(daysInMonth(month), Number(todayKey.slice(8, 10)));
    const dailySpend: { x: string; tutar: number }[] = [];
    for (let day = 1; day <= dayCount; day += 1) {
      const key = `${month}-${String(day).padStart(2, '0')}`;
      dailySpend.push({ x: key, tutar: Math.round((dailyMap.get(key) ?? 0) * 100) / 100 });
    }

    // category distribution (top 5 + other)
    const catMap = new Map<string, number>();
    for (const item of monthExpenses) {
      catMap.set(item.category, (catMap.get(item.category) ?? 0) + item.amount);
    }
    const sortedCats = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]);
    const topCats = sortedCats.slice(0, 4).map(([id, value]) => ({
      category: categoryById(id).label,
      value: Math.round(value * 100) / 100,
    }));
    const restValue = sortedCats.slice(4).reduce((sum, [, value]) => sum + value, 0);
    if (restValue > 0) topCats.push({ category: 'Diğer kategoriler', value: Math.round(restValue * 100) / 100 });

    // routines
    const routineInputs: RoutineInput[] = routines.map((routine) => ({
      id: routine.id,
      title: routine.title,
      period: routine.period,
      icon: routine.icon,
      target: routine.target,
      reminderTime: routine.reminderTime,
      completions: routine.completions.map((c) => utcDayKey(c.date)),
    }));
    const stats = routineInputs.map((routine) => buildStats(routine, todayKey));
    const dailyRoutines = stats.filter((s) => s.period === 'daily');
    const doneToday = dailyRoutines.filter((s) => s.todayDone).length;
    const routineRatio = dailyRoutines.length > 0 ? doneToday / dailyRoutines.length : 0;

    const routineSpark: number[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const key = addDaysToKey(todayKey, -i);
      const done = dailyRoutines.filter((s) => s.completions.includes(key)).length;
      routineSpark.push(dailyRoutines.length > 0 ? Math.round((done / dailyRoutines.length) * 100) : 0);
    }

    const routineProgress = stats
      .slice()
      .sort((a, b) => b.periodPercent - a.periodPercent)
      .slice(0, 6)
      .map((s) => ({ category: s.title, value: s.periodDone, max: s.periodTarget }));

    // last 6 months spark for expenses
    const monthMap = new Map<string, number>();
    for (const item of lastMonths) {
      const key = utcDayKey(item.date).slice(0, 7);
      monthMap.set(key, (monthMap.get(key) ?? 0) + item.amount);
    }
    const expenseSpark: number[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      expenseSpark.push(Math.round(monthMap.get(addMonths(month, -i)) ?? 0));
    }

    const budgetAmount = budget?.amount ?? null;
    const remaining = budgetAmount !== null ? Math.max(0, budgetAmount - total) : 0;
    const budgetUsedPct = budgetAmount && budgetAmount > 0 ? Math.min(100, Math.round((total / budgetAmount) * 100)) : 0;

    const weekStart = startOfWeekKey(todayKey);
    const weekDone = stats.reduce(
      (sum, s) => sum + s.completions.filter((c) => c >= weekStart && c <= addDaysToKey(weekStart, 6)).length,
      0,
    );
    const weekGoal = stats.reduce((sum, s) => sum + (s.period === 'daily' ? 7 : s.period === 'weekly' ? s.periodTarget : 0), 0);

    const data = {
      kpi_expense: [
        {
          label: 'Bu ay gider (₺)',
          value: Math.round(total * 100) / 100,
          format: 'integer',
          delta: deltaPct,
          delta_label: 'geçen aya göre',
          good_when: 'down',
        },
      ],
      kpi_budget: [
        {
          label: budgetAmount !== null ? 'Kalan bütçe (₺)' : 'Bütçe belirlenmedi',
          value: Math.round(remaining * 100) / 100,
          format: 'integer',
          delta: null,
          delta_label: budgetAmount !== null ? `bütçenin %${budgetUsedPct}'i kullanıldı` : '',
          good_when: 'up',
        },
      ],
      kpi_routines: [
        {
          label: 'Bugünkü rutin',
          value: Math.round(routineRatio * 1000) / 1000,
          format: 'percent',
          delta: null,
          delta_label: `${doneToday}/${dailyRoutines.length} tamamlandı`,
          good_when: 'up',
        },
      ],
      kpi_tasks: [
        {
          label: 'Açık görev',
          value: openTodos,
          format: 'integer',
          delta: null,
          delta_label: `bugün ${completedToday} görev bitti`,
          good_when: 'down',
        },
      ],
      daily_spend: dailySpend,
      monthly_spend: expenseSpark.map((value, index) => ({
        x: addMonths(month, index - 5),
        tutar: value,
      })),
      categories: topCats,
      routine_progress: routineProgress,
      recent_notes: recentNotes.map((note) => ({
        baslik: note.title,
        guncelleme: note.updatedAt.toISOString().slice(0, 10),
      })),
      summary: [
        { label: 'Haftalık rutin', value: weekDone, max: weekGoal },
        { label: 'Bütçe kullanımı', value: budgetUsedPct, max: 100 },
      ],
    };

    return NextResponse.json({
      data_as_of: new Date().toISOString(),
      data,
      meta: {
        month,
        total: Math.round(total * 100) / 100,
        budget: budgetAmount,
        remaining: Math.round(remaining * 100) / 100,
        budgetUsedPct,
        doneToday,
        dailyRoutineCount: dailyRoutines.length,
        openTodos,
        weekDone,
        weekGoal,
      },
    });
  } catch (error) {
    console.error('[dashboard:GET]', error);
    return NextResponse.json({ error: 'Özet yüklenemedi.' }, { status: 500 });
  }
}
