import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { isValidMonthKey, localDayKey, monthBounds, monthKeyOf, utcDayKey } from '@/lib/dates';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const todayKey = localDayKey();
  const requested = new URL(request.url).searchParams.get('month');
  const month = isValidMonthKey(requested) ? requested : monthKeyOf(todayKey);
  const { start, end } = monthBounds(month);

  try {
    const [routines, todos] = await Promise.all([
      prisma.routine.findMany({
        where: { userId, active: true },
        orderBy: [{ period: 'asc' }, { createdAt: 'asc' }],
        select: {
          id: true,
          title: true,
          period: true,
          target: true,
          reminderTime: true,
          completions: {
            where: { date: { gte: start, lt: end } },
            select: { date: true },
          },
        },
      }),
      prisma.todo.findMany({
        where: {
          userId,
          OR: [
            { dueDate: { gte: start, lt: end } },
            { reminderAt: { gte: start, lt: end } },
          ],
        },
        orderBy: [{ dueDate: 'asc' }, { reminderAt: 'asc' }],
        take: 300,
        select: {
          id: true,
          title: true,
          priority: true,
          dueDate: true,
          reminderAt: true,
          completed: true,
        },
      }),
    ]);

    return NextResponse.json({
      month,
      today: todayKey,
      goals: routines.map((routine) => ({
        id: routine.id,
        title: routine.title,
        period: routine.period,
        target: routine.target,
        reminderTime: routine.reminderTime,
        completions: routine.completions.map((completion) => utcDayKey(completion.date)),
      })),
      plans: todos.map((todo) => ({
        id: todo.id,
        title: todo.title,
        priority: todo.priority,
        dueDay: todo.dueDate ? utcDayKey(todo.dueDate) : null,
        reminderAt: todo.reminderAt ? todo.reminderAt.toISOString() : null,
        completed: todo.completed,
      })),
    });
  } catch (error) {
    console.error('[calendar:GET]', error);
    return NextResponse.json({ error: 'Takvim yüklenemedi.' }, { status: 500 });
  }
}
