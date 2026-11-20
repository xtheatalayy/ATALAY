'use client';

import { useCallback, useState } from 'react';
import { Delete, Divide, Equal, Minus, Percent, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatMoney } from '@/lib/dates';
import { cn } from '@/lib/utils';

type Operator = '+' | '-' | '×' | '÷' | null;

export function CalculatorDialog({
  open,
  onOpenChange,
  onUseResult,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseResult: (amount: number) => void;
}) {
  const [display, setDisplay] = useState('0');
  const [previous, setPrevious] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator>(null);
  const [waiting, setWaiting] = useState(false);
  const [history, setHistory] = useState('');

  const currentValue = Number(display.replace(',', '.')) || 0;

  const reset = () => {
    setDisplay('0');
    setPrevious(null);
    setOperator(null);
    setWaiting(false);
    setHistory('');
  };

  const inputDigit = (digit: string) => {
    if (waiting) {
      setDisplay(digit);
      setWaiting(false);
      return;
    }
    setDisplay((prev) => (prev === '0' ? digit : prev.length >= 12 ? prev : `${prev}${digit}`));
  };

  const inputDot = () => {
    if (waiting) {
      setDisplay('0.');
      setWaiting(false);
      return;
    }
    setDisplay((prev) => (prev.includes('.') ? prev : `${prev}.`));
  };

  const compute = (a: number, b: number, op: Operator): number => {
    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '×':
        return a * b;
      case '÷':
        return b === 0 ? 0 : a / b;
      default:
        return b;
    }
  };

  const chooseOperator = (nextOperator: Exclude<Operator, null>) => {
    const value = currentValue;
    if (previous !== null && operator && !waiting) {
      const result = compute(previous, value, operator);
      setPrevious(result);
      setDisplay(String(Math.round(result * 1000000) / 1000000));
      setHistory(`${formatMoney(result, 2)} ${nextOperator}`);
    } else {
      setPrevious(value);
      setHistory(`${formatMoney(value, 2)} ${nextOperator}`);
    }
    setOperator(nextOperator);
    setWaiting(true);
  };

  const equals = () => {
    if (previous === null || !operator) return;
    const result = compute(previous, currentValue, operator);
    const rounded = Math.round(result * 100) / 100;
    setHistory(`${formatMoney(previous, 2)} ${operator} ${formatMoney(currentValue, 2)} =`);
    setDisplay(String(rounded));
    setPrevious(null);
    setOperator(null);
    setWaiting(true);
  };

  const percent = () => {
    const base = previous ?? currentValue;
    const result = Math.round(((base * currentValue) / 100) * 100) / 100;
    setDisplay(String(result));
    setWaiting(true);
  };

  const backspace = () => {
    setDisplay((prev) => (prev.length <= 1 ? '0' : prev.slice(0, -1)));
  };

  const keyClass =
    'h-14 rounded-xl text-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[360px] p-4">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base">Hesap makinesi</DialogTitle>
          <DialogDescription className="text-xs">
            Hesapla ve sonucu tek dokunuşla gider olarak kaydet.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl bg-secondary px-4 py-3 text-right">
          <p className="h-4 truncate text-xs text-muted-foreground">{history || '\u00a0'}</p>
          <p className="truncate font-display text-3xl font-semibold tracking-tight">{display}</p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <button type="button" onClick={reset} className={cn(keyClass, 'bg-muted text-sm font-semibold text-muted-foreground hover:bg-accent')}>
            C
          </button>
          <button type="button" onClick={backspace} aria-label="Sil" className={cn(keyClass, 'bg-muted text-muted-foreground hover:bg-accent')}>
            <Delete className="mx-auto h-5 w-5" />
          </button>
          <button type="button" onClick={percent} aria-label="Yüzde" className={cn(keyClass, 'bg-muted text-muted-foreground hover:bg-accent')}>
            <Percent className="mx-auto h-5 w-5" />
          </button>
          <button type="button" onClick={() => chooseOperator('÷')} aria-label="Bölü" className={cn(keyClass, 'bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground')}>
            <Divide className="mx-auto h-5 w-5" />
          </button>

          {['7', '8', '9'].map((digit) => (
            <button key={digit} type="button" onClick={() => inputDigit(digit)} className={cn(keyClass, 'bg-card shadow-sm hover:bg-accent')}>
              {digit}
            </button>
          ))}
          <button type="button" onClick={() => chooseOperator('×')} aria-label="Çarpı" className={cn(keyClass, 'bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground')}>
            <X className="mx-auto h-5 w-5" />
          </button>

          {['4', '5', '6'].map((digit) => (
            <button key={digit} type="button" onClick={() => inputDigit(digit)} className={cn(keyClass, 'bg-card shadow-sm hover:bg-accent')}>
              {digit}
            </button>
          ))}
          <button type="button" onClick={() => chooseOperator('-')} aria-label="Eksi" className={cn(keyClass, 'bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground')}>
            <Minus className="mx-auto h-5 w-5" />
          </button>

          {['1', '2', '3'].map((digit) => (
            <button key={digit} type="button" onClick={() => inputDigit(digit)} className={cn(keyClass, 'bg-card shadow-sm hover:bg-accent')}>
              {digit}
            </button>
          ))}
          <button type="button" onClick={() => chooseOperator('+')} aria-label="Arti" className={cn(keyClass, 'bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground')}>
            <Plus className="mx-auto h-5 w-5" />
          </button>

          <button type="button" onClick={() => inputDigit('0')} className={cn(keyClass, 'col-span-2 bg-card shadow-sm hover:bg-accent')}>
            0
          </button>
          <button type="button" onClick={inputDot} className={cn(keyClass, 'bg-card shadow-sm hover:bg-accent')}>
            ,
          </button>
          <button type="button" onClick={equals} aria-label="Eşittir" className={cn(keyClass, 'bg-primary text-primary-foreground hover:bg-primary/90')}>
            <Equal className="mx-auto h-5 w-5" />
          </button>
        </div>

        <Button
          type="button"
          size="lg"
          className="h-11 w-full"
          onClick={() => {
            const amount = Math.round(currentValue * 100) / 100;
            if (amount > 0) {
              onUseResult(amount);
              onOpenChange(false);
              reset();
            }
          }}
        >
          Sonucu gider olarak kaydet
        </Button>
      </DialogContent>
    </Dialog>
  );
}
