'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Send, Trash2, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/components/i18n/language-provider';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

const QUICK_PROMPTS = [
  '📋 Bugün için günlük plan öner',
  '💰 Bütçe tasarrufu ipuçları ver',
  '🏃 Haftalık sağlık rutini öner',
  '⏰ Zaman yönetimi tavsiyeleri',
  '🥗 Sağlıklı beslenme önerileri',
  '🎯 Hedef belirleme yardımı',
];

export function AiChat() {
  const { locale } = useLocale();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    fetch('/api/chat/history')
      .then((r) => r.json())
      .then((data: ChatMsg[]) => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(() => {})
      .finally(() => setInitialLoading(false));
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg: ChatMsg = { id: `u-${Date.now()}`, role: 'user', content: msg };
    setMessages((prev) => [...prev, userMsg]);

    const assistantMsg: ChatMsg = { id: `a-${Date.now()}`, role: 'assistant', content: '' };
    setMessages((prev) => [...prev, assistantMsg]);
    setLoading(true);

    try {
      const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history, locale }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Hata oluştu' }));
        throw new Error(err.error || 'Yanıt alınamadı');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('Stream okunamadı');

      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        const content = full;
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsg.id ? { ...m, content } : m)),
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bir hata oluştu';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id ? { ...m, content: `⚠️ ${errorMessage}` } : m,
        ),
      );
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      await fetch('/api/chat/history', { method: 'DELETE' });
      setMessages([]);
      toast.success('Sohbet geçmişi temizlendi');
    } catch {
      toast.error('Geçmiş silinemedi');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-display text-sm font-semibold">Yapay Zeka Asistan</h2>
            <p className="text-[11px] text-muted-foreground">Planlama ve öneriler</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="icon" onClick={clearHistory} className="h-8 w-8 text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {initialLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Bot className="h-7 w-7" />
            </span>
            <h3 className="font-display text-base font-semibold">Merhaba! 👋</h3>
            <p className="mt-1 max-w-xs text-center text-sm text-muted-foreground">
              Planlama, bütçe, sağlık ve görev yönetimi konularında sana yardımcı olabilirim.
            </p>
            <div className="mt-5 grid w-full max-w-sm grid-cols-2 gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => void handleSend(prompt)}
                  className="rounded-xl border border-border/60 bg-card px-3 py-2.5 text-left text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={cn('flex gap-2.5', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'assistant' && (
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Bot className="h-3.5 w-3.5" />
                </span>
              )}
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'rounded-br-md bg-primary text-primary-foreground'
                    : 'rounded-bl-md bg-card shadow-sm border border-border/40',
                )}
              >
                {msg.content ? (
                  <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border/60 bg-background p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Bir şey sor..."
            rows={1}
            className="max-h-24 min-h-[42px] flex-1 resize-none rounded-xl border border-border/60 bg-card px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
          <Button
            size="icon"
            onClick={() => void handleSend()}
            disabled={!input.trim() || loading}
            className="h-[42px] w-[42px] shrink-0 rounded-xl"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
