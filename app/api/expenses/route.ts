import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { CATEGORY_IDS } from '@/lib/categories';
import { currentMonthKey, dayKeyToDate, isValidDayKey, isValidMonthKey, monthBounds } from '@/lib/dates';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  try {
    const url = new URL(request.url);
    const monthParam = url.searchParams.get('month');
    const month = isValidMonthKey(monthParam) ? monthParam : currentMonthKey();
    const { start, end } = monthBounds(month);

    const [expenses, budget] = await Promise.all([
      prisma.expense.findMany({
        where: { userId, date: { gte: start, lt: end } },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        select: { id: true, amount: true, category: true, date: true, note: true },
      }),
      prisma.budget.findUnique({ where: { userId_month: { userId, month } }, select: { amount: true } }),
    ]);

    const total = expenses.reduce((sum, item) => sum + item.amount, 0);
    const byCategoryMap = new Map<string, number>();
    for (const item of expenses) {
      byCategoryMap.set(item.category, (byCategoryMap.get(item.category) ?? 0) + item.amount);
    }
    const byCategory = Array.from(byCategoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    return NextResponse.json({
      month,
      total,
      budget: budget?.amount ?? null,
      byCategory,
      expenses: expenses.map((item) => ({
        id: item.id,
        amount: item.amount,
        category: item.category,
        date: item.date.toISOString(),
        note: item.note,
      })),
    });
  } catch (error) {
    console.error('[expenses:GET]', error);
    return NextResponse.json({ error: 'Giderler yüklenemedi.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  try {
    const body = await request.json().catch(() => null);
    const amount = Number(body?.amount);
    const category = typeof body?.category === 'string' ? body.category : '';
    const dateKey = typeof body?.date === 'string' ? body.date : '';
    const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 240) : '';

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Geçerli bir tutar girin.' }, { status: 400 });
    }
    if (!CATEGORY_IDS.includes(category)) {
      return NextResponse.json({ error: 'Geçerli bir kategori seçin.' }, { status: 400 });
    }
    if (!isValidDayKey(dateKey)) {
      return NextResponse.json({ error: 'Geçerli bir tarih seçin.' }, { status: 400 });
    }

    const created = await prisma.expense.create({
      data: {
        userId,
        amount: Math.round(amount * 100) / 100,
        category,
        date: dayKeyToDate(dateKey),
        note: note || null,
      },
      select: { id: true, amount: true, category: true, date: true, note: true },
    });

    return NextResponse.json(
      {
        ok: true,
        expense: {
          id: created.id,
          amount: created.amount,
          category: created.category,
          date: created.date.toISOString(),
          note: created.note,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('[expenses:POST]', error);
    return NextResponse.json({ error: 'Gider eklenemedi.' }, { status: 500 });
  }
}
