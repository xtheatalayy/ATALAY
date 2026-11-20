import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { dayKeyToDate, isValidDayKey } from '@/lib/dates';

export const dynamic = 'force-dynamic';

const PRIORITIES = ['low', 'normal', 'high'];

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  try {
    const todos = await prisma.todo.findMany({
      where: { userId },
      orderBy: [{ completed: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        notes: true,
        priority: true,
        dueDate: true,
        reminderAt: true,
        completed: true,
        completedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      todos: todos.map((todo) => ({
        ...todo,
        dueDate: todo.dueDate ? todo.dueDate.toISOString() : null,
        reminderAt: todo.reminderAt ? todo.reminderAt.toISOString() : null,
        completedAt: todo.completedAt ? todo.completedAt.toISOString() : null,
        createdAt: todo.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('[todos:GET]', error);
    return NextResponse.json({ error: 'Görevler yüklenemedi.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  try {
    const body = await request.json().catch(() => null);
    const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 140) : '';
    const notes = typeof body?.notes === 'string' ? body.notes.trim().slice(0, 500) : '';
    const priority = typeof body?.priority === 'string' && PRIORITIES.includes(body.priority) ? body.priority : 'normal';
    const dueDate = isValidDayKey(body?.dueDate) ? dayKeyToDate(body.dueDate) : null;
    const reminderAt = typeof body?.reminderAt === 'string' && !Number.isNaN(new Date(body.reminderAt).getTime())
      ? new Date(body.reminderAt)
      : null;

    if (title.length < 2) {
      return NextResponse.json({ error: 'Görev başlığı en az 2 karakter olmalı.' }, { status: 400 });
    }

    const created = await prisma.todo.create({
      data: { userId, title, notes: notes || null, priority, dueDate, reminderAt },
      select: {
        id: true,
        title: true,
        notes: true,
        priority: true,
        dueDate: true,
        reminderAt: true,
        completed: true,
        completedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        todo: {
          ...created,
          dueDate: created.dueDate ? created.dueDate.toISOString() : null,
          reminderAt: created.reminderAt ? created.reminderAt.toISOString() : null,
          completedAt: created.completedAt ? created.completedAt.toISOString() : null,
          createdAt: created.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('[todos:POST]', error);
    return NextResponse.json({ error: 'Görev eklenemedi.' }, { status: 500 });
  }
}
