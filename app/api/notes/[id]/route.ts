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
    const existing = await prisma.note.findFirst({ where: { id, userId }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: 'Not bulunamadı.' }, { status: 404 });

    const body = await request.json().catch(() => null);
    const data: { title?: string; content?: string; pinned?: boolean } = {};

    if (typeof body?.title === 'string') data.title = body.title.trim().slice(0, 120) || 'Başlıksız not';
    if (typeof body?.content === 'string') data.content = body.content.slice(0, 8000);
    if (typeof body?.pinned === 'boolean') data.pinned = body.pinned;

    const updated = await prisma.note.update({
      where: { id: existing.id },
      data,
      select: { id: true, title: true, content: true, pinned: true, createdAt: true, updatedAt: true },
    });

    return NextResponse.json({
      ok: true,
      note: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[notes:PATCH]', error);
    return NextResponse.json({ error: 'Not güncellenemedi.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  try {
    const { id } = await params;
    const existing = await prisma.note.findFirst({ where: { id, userId }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: 'Not bulunamadı.' }, { status: 404 });

    await prisma.note.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[notes:DELETE]', error);
    return NextResponse.json({ error: 'Not silinemedi.' }, { status: 500 });
  }
}
