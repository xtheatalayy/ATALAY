import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import * as webpush from 'web-push';

export const dynamic = 'force-dynamic';

webpush.setVapidDetails(
  'mailto:noreply@plannedlife.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  try {
    const { title, body, url } = (await request.json()) as { title: string; body: string; url?: string };

    const subs = await prisma.pushSubscription.findMany({
      where: { userId: session.user.id },
    });

    const payload = JSON.stringify({ title, body, url: url || '/' });

    const results = await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
          );
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number })?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          }
          throw err;
        }
      }),
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    return NextResponse.json({ ok: true, sent });
  } catch (error) {
    console.error('Push send error:', error);
    return NextResponse.json({ error: 'Bildirim gönderilemedi' }, { status: 500 });
  }
}
