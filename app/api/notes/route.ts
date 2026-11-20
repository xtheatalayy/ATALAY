import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') ?? '').trim();

    const notes = await prisma.note.findMany({
      where: q
        ? {
            userId,
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { content: { contains: q, mode: 'insensitive' } },
            ],
          }
        : { userId },
      orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
      take: 200,
      select: { id: true, title: true, content: true, pinned: true, createdAt: true, updatedAt: true },
    });

    return NextResponse.json({
      notes: notes.map((note) => ({
        ...note,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('[notes:GET]', error);
    return NextResponse.json({ error: 'Notlar yüklenemedi.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  try {
    const body = await request.json().catch(() => null);
    const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 120) : '';
    const content = typeof body?.content === 'string' ? body.content.slice(0, 8000) : '';

    if (!title && !content.trim()) {
      return NextResponse.json({ error: 'Not başlığı veya içeriği gerekli.' }, { status: 400 });
    }

    const created = await prisma.note.create({
      data: { userId, title: title || 'Başlıksız not', content },
      select: { id: true, title: true, content: true, pinned: true, createdAt: true, updatedAt: true },
    });

    return NextResponse.json(
      {
        ok: true,
        note: {
          ...created,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('[notes:POST]', error);
    return NextResponse.json({ error: 'Not kaydedilemedi.' }, { status: 500 });
  }
}
