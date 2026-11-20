import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { dayKeyToDate, isValidDayKey, localDayKey } from '@/lib/dates';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  try {
    const { id } = await params;
    const routine = await prisma.routine.findFirst({ where: { id, userId }, select: { id: true } });
    if (!routine) return NextResponse.json({ error: 'Rutin bulunamadı.' }, { status: 404 });

    const body = await request.json().catch(() => null);
    const dayKey = isValidDayKey(body?.day) ? body.day : localDayKey();
    const date = dayKeyToDate(dayKey);

    const existing = await prisma.routineCompletion.findUnique({
      where: { routineId_date: { routineId: routine.id, date } },
      select: { id: true },
    });

    if (existing) {
      await prisma.routineCompletion.delete({ where: { id: existing.id } });
      return NextResponse.json({ ok: true, done: false, day: dayKey });
    }

    await prisma.routineCompletion.create({ data: { routineId: routine.id, userId, date } });
    return NextResponse.json({ ok: true, done: true, day: dayKey });
  } catch (error) {
    console.error('[routines:toggle]', error);
    return NextResponse.json({ error: 'Rutin güncellenemedi.' }, { status: 500 });
  }
}
