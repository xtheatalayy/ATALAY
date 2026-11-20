import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  try {
    const { id } = await params;
    const existing = await prisma.expense.findFirst({ where: { id, userId }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: 'Gider bulunamadı.' }, { status: 404 });

    await prisma.expense.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[expenses:DELETE]', error);
    return NextResponse.json({ error: 'Gider silinemedi.' }, { status: 500 });
  }
}
