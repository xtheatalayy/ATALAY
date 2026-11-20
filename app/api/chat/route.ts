import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { languageEnglishName } from '@/lib/i18n/languages';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `Sen "Planned Life" uygulamasının yapay zeka asistanısın. Kullanıcıya günlük planlama, bütçe yönetimi, sağlık rutinleri, görev yönetimi ve notlar konusunda yardımcı oluyorsun.

Görevlerin:
- Kullanıcının sorularına Türkçe olarak kısa, net ve faydalı cevaplar ver.
- Günlük, haftalık ve aylık plan önerileri sun.
- Bütçe yönetimi konusunda tavsiyelerde bulun.
- Sağlıklı yaşam rutinleri öner.
- Görev önceliklendirmesinde yardım et.
- Motivasyon ve verimlilik ipuçları paylaş.

Her zaman nazik, destekleyici ve pratik ol. Cevaplarını kısa tut (en fazla 2-3 paragraf). Emoji kullanabilirsin ama abartma.`;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Yetkisiz' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API anahtarı yapılandırılmamış' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { message, history, locale } = (await request.json()) as {
      message: string;
      history?: { role: string; content: string }[];
      locale?: string;
    };

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: 'Mesaj gerekli' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: { userId: session.user.id, role: 'user', content: message.trim() },
    });

    const requestedLanguage = locale && locale !== 'tr' ? languageEnglishName(locale) : null;
    const systemPrompt = requestedLanguage
      ? `${SYSTEM_PROMPT}\n\nKullanıcı arayüz dilini "${requestedLanguage}" olarak seçti. Yanıtlarını yalnızca ${requestedLanguage} dilinde ver.`
      : SYSTEM_PROMPT;

    // Build messages array
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...(history ?? []).slice(-10).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: message.trim() },
    ];

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
        messages,
        stream: true,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Bilinmeyen hata');
      console.error('LLM API error:', response.status, errText);
      return new Response(JSON.stringify({ error: 'Yapay zeka yanıt veremedi' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    const userId = session.user.id;

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) { controller.close(); return; }
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let fullContent = '';
        let partialRead = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            partialRead += decoder.decode(value, { stream: true });
            const lines = partialRead.split('\n');
            partialRead = lines.pop() || '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content || '';
                if (delta) {
                  fullContent += delta;
                  controller.enqueue(encoder.encode(delta));
                }
              } catch {
                // skip
              }
            }
          }

          // Save assistant reply
          if (fullContent) {
            await prisma.chatMessage.create({
              data: { userId, role: 'assistant', content: fullContent },
            }).catch(console.error);
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: 'Sunucu hatası' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
