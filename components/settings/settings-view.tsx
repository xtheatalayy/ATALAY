'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BellRing, Check, Music2, Play, Search, Settings2, Smartphone, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';
import { PageIntro } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  DEFAULT_SOUND_SETTINGS,
  TONES,
  getTone,
  playToneById,
  readSoundSettings,
  saveSoundSettings,
  type SoundSettings,
} from '@/lib/notification-sounds';

export function SettingsView() {
  const [settings, setSettings] = useState<SoundSettings>(DEFAULT_SOUND_SETTINGS);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setSettings(readSoundSettings());
    setMounted(true);
  }, []);

  const update = (patch: Partial<SoundSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSoundSettings(next);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr');
    if (!q) return TONES;
    return TONES.filter(
      (tone) => tone.name.toLocaleLowerCase('tr').includes(q) || tone.category.toLocaleLowerCase('tr').includes(q),
    );
  }, [query]);

  const selectedTone = getTone(settings.toneId);

  const testSound = async () => {
    if (!settings.enabled) {
      toast('Bildirim sesleri kapalı', { description: 'Test etmek için önce sesleri aç.' });
      return;
    }
    await playToneById(settings.toneId, { volume: settings.volume });
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const registration = await navigator.serviceWorker?.getRegistration?.();
        await registration?.showNotification?.('Planned Life', {
          body: `Test bildirimi — ${selectedTone.name}`,
          icon: '/icon-192.png',
          tag: 'pl-sound-test',
          silent: true,
        });
      }
    } catch (error) {
      console.warn('[sound-test]', error);
    }
  };

  return (
    <div className="space-y-4">
      <PageIntro title="Ayarlar" description="Bildirim sesini, ses düzeyini ve uygulama tercihlerini yönet." />

      <section className="rounded-2xl bg-card p-4 shadow-sm sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
              {settings.enabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </span>
            <div>
              <p className="text-sm font-semibold">Bildirim sesi</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Hatırlatmalar geldiğinde seçtiğin zil sesi çalar.
              </p>
            </div>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => update({ enabled: checked })}
            aria-label="Bildirim seslerini aç/kapat"
          />
        </div>

        <div className={cn('mt-5 space-y-2', !settings.enabled && 'pointer-events-none opacity-50')}>
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">Ses düzeyi</span>
            <span className="tabular-nums font-semibold">
              {settings.volume === 0 ? 'Sessiz' : `%${settings.volume}`}
            </span>
          </div>
          <Slider
            value={[settings.volume]}
            min={0}
            max={100}
            step={5}
            disabled={!settings.enabled}
            onValueChange={([value]) => update({ volume: value ?? settings.volume })}
            aria-label="Bildirim ses düzeyi"
          />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button size="sm" className="h-9 gap-1.5" onClick={() => void testSound()}>
            <BellRing className="h-4 w-4" /> Sesi test et
          </Button>
          <span className="text-xs text-muted-foreground">
            Seçili ton: <span className="font-medium text-foreground">{selectedTone.name}</span>
          </span>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl bg-card shadow-sm">
        <div className="flex flex-col gap-2 border-b border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Music2 className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Zil sesleri</p>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
              {filtered.length} / {TONES.length}
            </span>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ton veya kategori ara…"
              className="h-9 pl-9"
              aria-label="Zil sesi ara"
            />
          </div>
        </div>

        <div data-no-translate className="max-h-[420px] divide-y divide-border/50 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">Eşleşen zil sesi bulunamadı.</p>
          ) : (
            filtered.map((tone) => {
              const selected = tone.id === settings.toneId;
              return (
                <div key={tone.id} className={cn('flex items-center gap-1 px-2', selected && 'bg-primary/5')}>
                  <button
                    type="button"
                    onClick={() => update({ toneId: tone.id })}
                    aria-pressed={selected}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span
                      className={cn(
                        'grid h-8 w-8 shrink-0 place-items-center rounded-lg',
                        selected ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground',
                      )}
                    >
                      {selected ? <Check className="h-4 w-4" /> : <Music2 className="h-4 w-4" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{tone.name}</span>
                      <span className="block text-[11px] text-muted-foreground">{tone.category}</span>
                    </span>
                  </button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:text-primary"
                    aria-label={`${tone.name} tonunu dinle`}
                    disabled={!mounted}
                    onClick={() => {
                      void playToneById(tone.id, { volume: Math.max(settings.volume, 25) });
                    }}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-card p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
            <Smartphone className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Sistem bildirimleri</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Bu sesler uygulama açıkken çalar. Telefon kilitliyken gelen sistem bildirimlerinin sesi işletim sistemi
              tarafından belirlenir; uygulama bu sesi değiştiremez.
            </p>
            <Button asChild variant="link" className="mt-1 h-auto px-0 text-xs">
              <Link href="/hatirlaticilar" className="gap-1">
                <BellRing className="h-3.5 w-3.5" /> Bildirim izinlerini yönet
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-card p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
            <Settings2 className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Nerede saklanır?</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Ses tercihleri bu cihazda saklanır. Farklı bir cihaz veya tarayıcıda yeniden seçmen gerekir.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
