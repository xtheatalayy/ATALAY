'use client';

import { useMemo, useState } from 'react';
import { Check, Globe } from 'lucide-react';
import { LANGUAGES } from '@/lib/i18n/languages';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useLocale } from './language-provider';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LANGUAGES;
    return LANGUAGES.filter(
      (l) =>
        l.native.toLowerCase().includes(q) ||
        l.english.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery('');
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Dili değiştir"
          className={cn(
            'grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            className,
          )}
        >
          <Globe className="h-[18px] w-[18px]" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Dil ara…"
          className="mb-2 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="max-h-72 overflow-y-auto">
          {filtered.map((language) => (
            <button
              key={language.code}
              type="button"
              data-no-translate
              onClick={() => setLocale(language.code)}
              className={cn(
                'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-start text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                language.code === locale && 'bg-accent/60',
              )}
            >
              <span className="truncate">
                {language.native}
                <span className="ms-2 text-xs text-muted-foreground">{language.english}</span>
              </span>
              {language.code === locale ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
            </button>
          ))}
          {filtered.length === 0 ? (
            <p className="px-2.5 py-3 text-sm text-muted-foreground">Sonuç yok</p>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
