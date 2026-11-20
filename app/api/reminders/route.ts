import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { localDayKey, utcDayKey } from '@/lib/dates';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  try {
    const todayKey = localDayKey();
    const [routines, todos] = await Promise.all([
      prisma.routine.findMany({
        where: { userId, active: true, reminderTime: { not: null } },
        orderBy: { reminderTime: 'asc' },
        select: {
          id: true,
          title: true,
          period: true,
          reminderTime: true,
          completions: { where: { date: new Date(`${todayKey}T00:00:00.000Z`) }, select: { id: true } },
        },
      }),
      prisma.todo.findMany({
        where: { userId, completed: false, reminderAt: { not: null } },
        orderBy: { reminderAt: 'asc' },
        take: 50,
        select: { id: true, title: true, reminderAt: true, priority: true, dueDate: true },
      }),
    ]);

    return NextResponse.json({
      today: todayKey,
      routines: routines.map((routine) => ({
        id: routine.id,
        title: routine.title,
        period: routine.period,
        time: routine.reminderTime,
        doneToday: routine.completions.length > 0,
      })),
      todos: todos.map((todo) => ({
        id: todo.id,
        title: todo.title,
        priority: todo.priority,
        reminderAt: todo.reminderAt ? todo.reminderAt.toISOString() : null,
        dueDate: todo.dueDate ? utcDayKey(todo.dueDate) : null,
      })),
    });
  } catch (error) {
    console.error('[reminders:GET]', error);
    return NextResponse.json({ error: 'Hatırlatıcılar yüklenemedi.' }, { status: 500 });
  }
}
