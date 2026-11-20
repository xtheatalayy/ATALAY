import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { dayKeyToDate, isValidDayKey } from '@/lib/dates';

export const dynamic = 'force-dynamic';

const PRIORITIES = ['low', 'normal', 'high'];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  try {
    const { id } = await params;
    const existing = await prisma.todo.findFirst({ where: { id, userId }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: 'Görev bulunamadı.' }, { status: 404 });

    const body = await request.json().catch(() => null);
    const data: {
      title?: string;
      notes?: string | null;
      priority?: string;
      dueDate?: Date | null;
      reminderAt?: Date | null;
      completed?: boolean;
      completedAt?: Date | null;
    } = {};

    if (typeof body?.title === 'string' && body.title.trim().length >= 2) {
      data.title = body.title.trim().slice(0, 140);
    }
    if (typeof body?.notes === 'string') {
      data.notes = body.notes.trim().slice(0, 500) || null;
    }
    if (typeof body?.priority === 'string' && PRIORITIES.includes(body.priority)) {
      data.priority = body.priority;
    }
    if (body?.dueDate === null) {
      data.dueDate = null;
    } else if (isValidDayKey(body?.dueDate)) {
      data.dueDate = dayKeyToDate(body.dueDate);
    }
    if (body?.reminderAt === null) {
      data.reminderAt = null;
    } else if (typeof body?.reminderAt === 'string' && !Number.isNaN(new Date(body.reminderAt).getTime())) {
      data.reminderAt = new Date(body.reminderAt);
    }
    if (typeof body?.completed === 'boolean') {
      data.completed = body.completed;
      data.completedAt = body.completed ? new Date() : null;
    }

    const updated = await prisma.todo.update({
      where: { id: existing.id },
      data,
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
      ok: true,
      todo: {
        ...updated,
        dueDate: updated.dueDate ? updated.dueDate.toISOString() : null,
        reminderAt: updated.reminderAt ? updated.reminderAt.toISOString() : null,
        completedAt: updated.completedAt ? updated.completedAt.toISOString() : null,
        createdAt: updated.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[todos:PATCH]', error);
    return NextResponse.json({ error: 'Görev güncellenemedi.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  try {
    const { id } = await params;
    const existing = await prisma.todo.findFirst({ where: { id, userId }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: 'Görev bulunamadı.' }, { status: 404 });

    await prisma.todo.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[todos:DELETE]', error);
    return NextResponse.json({ error: 'Görev silinemedi.' }, { status: 500 });
  }
}
