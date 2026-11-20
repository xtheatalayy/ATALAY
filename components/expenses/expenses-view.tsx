'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calculator,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Target,
  Trash2,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState, PageIntro } from '@/components/app-shell';
import { GlyphIcon } from '@/components/glyph-icon';
import { AnimatedNumber } from '@/components/animated-number';
import { CalculatorDialog } from '@/components/expenses/calculator-dialog';
import { EXPENSE_CATEGORIES, categoryById } from '@/lib/categories';
import { addMonths, formatDayKey, formatMoney, formatMonthKey, localDayKey, utcDayKey } from '@/lib/dates';
import { cn } from '@/lib/utils';

type ExpenseItem = { id: string; amount: number; category: string; date: string; note: string | null };

type ExpensesPayload = {
  month: string;
  total: number;
  budget: number | null;
  byCategory: { category: string; amount: number }[];
  expenses: ExpenseItem[];
};

function dayLabel(dayKey: string, todayKey: string): string {
  if (dayKey === todayKey) return 'Bugün';
  const yesterday = new Date(`${todayKey}T00:00:00.000Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  if (dayKey === utcDayKey(yesterday)) return 'Dün';
  return formatDayKey(dayKey, { weekday: 'long', day: 'numeric', month: 'long' });
}

export function ExpensesView({ initialTodayKey }: { initialTodayKey: string }) {
  const [todayKey, setTodayKey] = useState(initialTodayKey);
  const [month, setMonth] = useState(initialTodayKey.slice(0, 7));
  const [payload, setPayload] = useState<ExpensesPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('market');
  const [date, setDate] = useState(initialTodayKey);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/expenses?month=${month}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as ExpensesPayload;
      setPayload(data);
      setError('');
    } catch (err) {
      console.warn('[expenses]', err);
      setError('Giderler yüklenemedi. Bağlantını kontrol edip tekrar dene.');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setTodayKey(localDayKey());
  }, []);

  const expenses = payload?.expenses ?? [];
  const total = payload?.total ?? 0;
  const budget = payload?.budget ?? null;
  const remaining = budget !== null ? budget - total : null;
  const usedPercent = budget && budget > 0 ? Math.min(100, Math.round((total / budget) * 100)) : 0;

  const filtered = useMemo(
    () => (filter === 'all' ? expenses : expenses.filter((item) => item.category === filter)),
    [expenses, filter],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, ExpenseItem[]>();
    for (const item of filtered) {
      const key = utcDayKey(new Date(item.date));
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);

  const maxCategory = Math.max(1, ...(payload?.byCategory ?? []).map((item) => item.amount));

  const openAdd = (presetAmount?: number) => {
    setAmount(presetAmount ? String(presetAmount) : '');
    setCategory('market');
    setDate(todayKey);
    setNote('');
    setAddOpen(true);
  };

  const submitExpense = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = Number(amount.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error('Geçerli bir tutar gir.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ amount: parsed, category, date, note }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data?.error ?? 'Gider eklenemedi.');
      }
      toast.success('Gider kaydedildi.');
      setAddOpen(false);
      setMonth(date.slice(0, 7));
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gider eklenemedi.');
    } finally {
      setSaving(false);
    }
  };

  const removeExpense = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gider silinemedi.');
      toast.success('Gider silindi.');
      setConfirmId(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gider silinemedi.');
    }
  };

  const saveBudget = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = Number(budgetInput.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error('Geçerli bir bütçe tutarı gir.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/budget', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ month, amount: parsed }),
      });
      if (!res.ok) throw new Error('Bütçe kaydedilemedi.');
      toast.success(parsed === 0 ? 'Bütçe kaldırıldı.' : 'Aylık bütçe kaydedildi.');
      setBudgetOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bütçe kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageIntro
        title="Giderler"
        description="Harcamalarını kaydet, bütçeni takip et, hesabını tek dokunuşla yap."
        action={
          <Button size="sm" className="h-10 gap-1.5 rounded-full px-4" onClick={() => openAdd()}>
            <Plus className="h-4 w-4" /> Gider ekle
          </Button>
        }
      />

      <div className="flex items-center justify-between rounded-full bg-card px-1.5 py-1 shadow-sm">
        <Button variant="ghost" size="icon" aria-label="Önceki ay" className="h-9 w-9 rounded-full" onClick={() => setMonth((prev) => addMonths(prev, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="font-display text-sm font-semibold capitalize">{formatMonthKey(month)}</p>
          {month !== todayKey.slice(0, 7) ? (
            <button type="button" onClick={() => setMonth(todayKey.slice(0, 7))} className="text-[11px] font-medium text-primary hover:underline">
              Bu aya dön
            </button>
          ) : (
            <p className="text-[11px] text-muted-foreground">Bu ay</p>
          )}
        </div>
        <Button variant="ghost" size="icon" aria-label="Sonraki ay" className="h-9 w-9 rounded-full" onClick={() => setMonth((prev) => addMonths(prev, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-sm sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Toplam harcama</p>
            <p className="mt-1 font-display text-3xl font-semibold tracking-tight">
              <AnimatedNumber value={total} format={(value) => formatMoney(value, 2)} />
            </p>
          </div>
          <Button variant="secondary" size="sm" className="h-9 gap-1.5 rounded-full" onClick={() => { setBudgetInput(budget !== null ? String(budget) : ''); setBudgetOpen(true); }}>
            <Target className="h-4 w-4" /> Bütçe
          </Button>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {budget !== null ? `Aylık bütçe ${formatMoney(budget, 0)}` : 'Aylık bütçe belirlenmedi'}
            </span>
            {budget !== null ? (
              <span className={cn('font-medium', remaining !== null && remaining < 0 ? 'text-destructive' : 'text-primary')}>
                {remaining !== null && remaining < 0
                  ? `${formatMoney(Math.abs(remaining), 0)} aşım`
                  : `${formatMoney(remaining ?? 0, 0)} kaldı`}
              </span>
            ) : null}
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full rounded-full transition-all duration-500', usedPercent >= 100 ? 'bg-destructive' : usedPercent >= 80 ? 'bg-amber-500' : 'bg-primary')}
              style={{ width: `${budget !== null ? Math.max(2, usedPercent) : 0}%` }}
            />
          </div>
          {budget !== null ? (
            <p className="text-[11px] text-muted-foreground">Bütçenin %{usedPercent}&apos;i kullanıldı.</p>
          ) : (
            <p className="text-[11px] text-muted-foreground">Bütçe belirleyerek kalan tutarı her an görebilirsin.</p>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button className="h-11 gap-1.5" onClick={() => openAdd()}>
            <Plus className="h-4 w-4" /> Hızlı gider
          </Button>
          <Button variant="secondary" className="h-11 gap-1.5" onClick={() => setCalcOpen(true)}>
            <Calculator className="h-4 w-4" /> Hesap makinesi
          </Button>
        </div>
      </div>

      {(payload?.byCategory ?? []).length > 0 ? (
        <div className="rounded-2xl bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold">Kategori dağılımı</h2>
            <span className="text-xs text-muted-foreground">{formatMonthKey(month)}</span>
          </div>
          <ul className="space-y-3">
            {(payload?.byCategory ?? []).map((item) => {
              const meta = categoryById(item.category);
              const share = total > 0 ? Math.round((item.amount / total) * 100) : 0;
              return (
                <li key={item.category}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md" style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}>
                        <GlyphIcon name={meta.icon} className="h-3.5 w-3.5" />
                      </span>
                      <span className="truncate font-medium">{meta.label}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {formatMoney(item.amount, 0)} · %{share}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(3, (item.amount / maxCategory) * 100)}%`, backgroundColor: meta.color }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={cn(
            'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
            filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground shadow-sm hover:text-foreground',
          )}
        >
          Tümü
        </button>
        {EXPENSE_CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              filter === item.id ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground shadow-sm hover:text-foreground',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl bg-card py-10 text-sm text-muted-foreground shadow-sm">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Yükleniyor…
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-card p-5 text-center text-sm text-muted-foreground shadow-sm">
          {error}
          <div className="mt-3">
            <Button size="sm" variant="secondary" onClick={() => void load()}>Tekrar dene</Button>
          </div>
        </div>
      ) : grouped.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Henüz gider yok"
          description="İlk harcamanı ekle; aylık toplam ve kategori dağılımı otomatik oluşsun."
          action={<Button size="sm" className="gap-1.5" onClick={() => openAdd()}><Plus className="h-4 w-4" /> Gider ekle</Button>}
        />
      ) : (
        <div className="space-y-4">
          {grouped.map(([day, items]) => (
            <div key={day}>
              <div className="mb-1.5 flex items-center justify-between px-1">
                <p className="text-xs font-semibold capitalize text-muted-foreground">{dayLabel(day, todayKey)}</p>
                <p className="text-xs tabular-nums text-muted-foreground">
                  {formatMoney(items.reduce((sum, item) => sum + item.amount, 0), 2)}
                </p>
              </div>
              <ul className="overflow-hidden rounded-2xl bg-card shadow-sm">
                {items.map((item, index) => {
                  const meta = categoryById(item.category);
                  return (
                    <li
                      key={item.id}
                      className={cn('flex items-center gap-3 px-3 py-3', index > 0 ? 'border-t border-border/60' : '')}
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}>
                        <GlyphIcon name={meta.icon} className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{meta.label}</p>
                        {item.note ? <p className="truncate text-xs text-muted-foreground">{item.note}</p> : null}
                      </div>
                      <p className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(item.amount, 2)}</p>
                      {confirmId === item.id ? (
                        <div className="flex shrink-0 items-center gap-1">
                          <Button size="xs" variant="destructive" className="h-7 rounded-full px-2 text-[11px]" onClick={() => void removeExpense(item.id)}>
                            Sil
                          </Button>
                          <Button size="xs" variant="ghost" className="h-7 rounded-full px-2 text-[11px]" onClick={() => setConfirmId(null)}>
                            Vazgeç
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          aria-label="Gideri sil"
                          onClick={() => setConfirmId(item.id)}
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Gider ekle</DialogTitle>
            <DialogDescription>Tutarı, kategoriyi ve tarihi gir; gerisini uygulama hesaplar.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitExpense} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Tutar (₺)</Label>
              <Input
                id="amount"
                inputMode="decimal"
                autoFocus
                required
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0,00"
                className="h-12 text-lg font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <div className="grid grid-cols-4 gap-1.5">
                {EXPENSE_CATEGORIES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategory(item.id)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-medium transition-all',
                      category === item.id ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:bg-accent',
                    )}
                  >
                    <GlyphIcon name={item.icon} className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="date">Tarih</Label>
                <Input id="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-11" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="note">Not (isteğe bağlı)</Label>
                <Input id="note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="ör. market" className="h-11" maxLength={240} />
              </div>
            </div>

            <Button type="submit" size="lg" className="h-11 w-full" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Kaydet
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={budgetOpen} onOpenChange={setBudgetOpen}>
        <DialogContent className="max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Aylık bütçe</DialogTitle>
            <DialogDescription>{formatMonthKey(month)} için harcama limitini belirle. 0 girerek bütçeyi kaldırabilirsin.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveBudget} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="budget">Bütçe tutarı (₺)</Label>
              <Input
                id="budget"
                inputMode="decimal"
                autoFocus
                value={budgetInput}
                onChange={(event) => setBudgetInput(event.target.value)}
                placeholder="0,00"
                className="h-12 text-lg font-semibold"
              />
            </div>
            <Button type="submit" size="lg" className="h-11 w-full" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Bütçeyi kaydet
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <CalculatorDialog
        open={calcOpen}
        onOpenChange={setCalcOpen}
        onUseResult={(value) => {
          openAdd(value);
        }}
      />
    </div>
  );
}
