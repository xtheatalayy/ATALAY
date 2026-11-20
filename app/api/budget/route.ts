import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { isValidMonthKey } from '@/lib/dates';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  try {
    const body = await request.json().catch(() => null);
    const month = typeof body?.month === 'string' ? body.month : '';
    const amount = Number(body?.amount);

    if (!isValidMonthKey(month)) {
      return NextResponse.json({ error: 'Geçerli bir ay seçin.' }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount < 0) {
      return NextResponse.json({ error: 'Geçerli bir bütçe tutarı girin.' }, { status: 400 });
    }

    if (amount === 0) {
      await prisma.budget.deleteMany({ where: { userId, month } });
      return NextResponse.json({ ok: true, budget: null });
    }

    const saved = await prisma.budget.upsert({
      where: { userId_month: { userId, month } },
      create: { userId, month, amount: Math.round(amount * 100) / 100 },
      update: { amount: Math.round(amount * 100) / 100 },
      select: { amount: true },
    });

    return NextResponse.json({ ok: true, budget: saved.amount });
  } catch (error) {
    console.error('[budget:PUT]', error);
    return NextResponse.json({ error: 'Bütçe kaydedilemedi.' }, { status: 500 });
  }
}
