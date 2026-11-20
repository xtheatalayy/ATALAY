import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  try {
    const { id } = await params;
    const existing = await prisma.routine.findFirst({ where: { id, userId }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: 'Rutin bulunamadı.' }, { status: 404 });

    const body = await request.json().catch(() => null);
    const data: { title?: string; reminderTime?: string | null } = {};

    if (typeof body?.title === 'string' && body.title.trim().length >= 2) {
      data.title = body.title.trim().slice(0, 80);
    }
    if (typeof body?.reminderTime === 'string') {
      data.reminderTime = /^\d{2}:\d{2}$/.test(body.reminderTime) ? body.reminderTime : null;
    } else if (body?.reminderTime === null) {
      data.reminderTime = null;
    }

    const updated = await prisma.routine.update({
      where: { id: existing.id },
      data,
      select: { id: true, title: true, reminderTime: true },
    });

    return NextResponse.json({ ok: true, routine: updated });
  } catch (error) {
    console.error('[routines:PATCH]', error);
    return NextResponse.json({ error: 'Rutin güncellenemedi.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  try {
    const { id } = await params;
    const existing = await prisma.routine.findFirst({ where: { id, userId }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: 'Rutin bulunamadı.' }, { status: 404 });

    await prisma.routine.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[routines:DELETE]', error);
    return NextResponse.json({ error: 'Rutin silinemedi.' }, { status: 500 });
  }
}
