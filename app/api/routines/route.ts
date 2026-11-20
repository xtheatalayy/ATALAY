import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { addDaysToKey, localDayKey, utcDayKey } from '@/lib/dates';

export const dynamic = 'force-dynamic';

const PERIODS = ['daily', 'weekly', 'monthly'];
const ICONS = ['water', 'walk', 'pill', 'dumbbell', 'sleep', 'meditate', 'book', 'sun', 'sparkles'];

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  try {
    const since = addDaysToKey(localDayKey(), -120);
    const routines = await prisma.routine.findMany({
      where: { userId, active: true },
      orderBy: [{ period: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        title: true,
        period: true,
        icon: true,
        target: true,
        reminderTime: true,
        completions: {
          where: { date: { gte: new Date(`${since}T00:00:00.000Z`) } },
          select: { date: true },
        },
      },
    });

    return NextResponse.json({
      routines: routines.map((routine) => ({
        id: routine.id,
        title: routine.title,
        period: routine.period,
        icon: routine.icon,
        target: routine.target,
        reminderTime: routine.reminderTime,
        completions: routine.completions.map((c) => utcDayKey(c.date)),
      })),
    });
  } catch (error) {
    console.error('[routines:GET]', error);
    return NextResponse.json({ error: 'Rutinler yüklenemedi.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  try {
    const body = await request.json().catch(() => null);
    const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 80) : '';
    const period = typeof body?.period === 'string' ? body.period : 'daily';
    const icon = typeof body?.icon === 'string' && ICONS.includes(body.icon) ? body.icon : 'sparkles';
    const targetRaw = Number(body?.target);
    const target = Number.isFinite(targetRaw) && targetRaw > 0 ? Math.min(31, Math.round(targetRaw)) : 1;
    const reminderTime = typeof body?.reminderTime === 'string' && /^\d{2}:\d{2}$/.test(body.reminderTime) ? body.reminderTime : null;

    if (title.length < 2) {
      return NextResponse.json({ error: 'Rutin adı en az 2 karakter olmalı.' }, { status: 400 });
    }
    if (!PERIODS.includes(period)) {
      return NextResponse.json({ error: 'Geçerli bir periyot seçin.' }, { status: 400 });
    }

    const created = await prisma.routine.create({
      data: { userId, title, period, icon, target, reminderTime },
      select: { id: true, title: true, period: true, icon: true, target: true, reminderTime: true },
    });

    return NextResponse.json({ ok: true, routine: { ...created, completions: [] } }, { status: 201 });
  } catch (error) {
    console.error('[routines:POST]', error);
    return NextResponse.json({ error: 'Rutin eklenemedi.' }, { status: 500 });
  }
}
