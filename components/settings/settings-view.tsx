'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
  BellRing,
  Check,
  LogOut,
  Music2,
  Palette,
  Play,
  Search,
  Smartphone,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageIntro } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { THEMES, useTheme } from '@/components/theme-provider';
import { isPushSubscribed, subscribeToPush, unsubscribeFromPush } from '@/lib/push-utils';
import { isMuted, setMuted } from '@/lib/notification-prefs';
import {
  DEFAULT_SOUND_SETTINGS,
  TONES,
  getTone,
  playToneById,
  readSoundSettings,
  saveSoundSettings,
  type SoundSettings,
} from '@/lib/notification-sounds';
import { cn } from '@/lib/utils';

export function SettingsView({ name, email }: { name?: string | null; email?: string | null }) {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<SoundSettings>(DEFAULT_SOUND_SETTINGS);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const [pushSupported, setPushSupported] = useState(false);
  const [pushOn, setPushOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    setSettings(readSoundSettings());
    setMutedState(isMuted());
    setMounted(true);
    if (typeof window !== 'undefined' && 'PushManager' in window) {
      setPushSupported(true);
      isPushSubscribed()
        .then(setPushOn)
        .catch(() => {});
    }
  }, []);

  const update = (patch: Partial<SoundSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSoundSettings(next);
  };

  const togglePush = async (next: boolean) => {
    setPushBusy(true);
    try {
      if (next) {
        const ok = await subscribeToPush();
        setPushOn(ok);
        toast(ok ? 'Bildirimler açıldı' : 'Bildirim izni verilemedi', {
          description: ok ? 'Hatırlatmalar bu cihaza gönderilecek.' : 'Tarayıcı ayarlarından bildirim iznini kontrol et.',
        });
      } else {
        await unsubscribeFromPush();
        setPushOn(false);
        toast('Bildirimler kapatıldı');
      }
    } catch {
      toast.error('Bildirim ayarı değiştirilemedi');
    } finally {
      setPushBusy(false);
    }
  };

  const toggleMuted = (next: boolean) => {
    setMuted(next);
    setMutedState(next);
    toast(next ? 'Sessiz mod açıldı' : 'Sessiz mod kapandı', {
      description: next ? 'Hatırlatma sesleri ve açılır bildirimler gösterilmez.' : 'Hatırlatmalar yeniden sesli görünecek.',
    });
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
    if (settings.volume === 0) {
      toast('Ses düzeyi sıfır', { description: 'Test için düzeyi yükselt.' });
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
      <PageIntro title="Ayarlar" description="Tema, bildirimler ve zil sesi tercihlerini tek yerden yönet." />

      <section className="rounded-2xl bg-card p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Görünüm</p>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">Uygulamanın renk temasını seç.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {THEMES.map((item) => {
            const active = theme === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTheme(item.id)}
                aria-pressed={active}
                className={cn(
                  'relative flex items-center gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/60',
                )}
              >
                <span className="flex shrink-0 items-center">
                  <span
                    className="h-7 w-7 rounded-full border border-black/10 shadow-sm dark:border-white/20"
                    style={{ backgroundColor: item.background }}
                  />
                  <span
                    className="-ml-2 h-7 w-7 rounded-full border border-black/10 shadow-sm dark:border-white/20"
                    style={{ backgroundColor: item.primary }}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{item.label}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{item.description}</span>
                </span>
                {active ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl bg-card p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-2">
          <BellRing className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Bildirimler</p>
        </div>

        <div className="mt-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">Bildirimleri aç</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Hatırlatmaları bu cihazda sistem bildirimi olarak al.
            </p>
          </div>
          {pushSupported ? (
            <Switch
              checked={pushOn}
              disabled={pushBusy}
              onCheckedChange={(next) => void togglePush(next)}
              aria-label="Bildirimleri aç/kapat"
            />
          ) : (
            <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground">Desteklenmiyor</span>
          )}
        </div>

        <div className="mt-4 flex items-start justify-between gap-3 border-t border-border/60 pt-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">Sessize al</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Sessiz modda hatırlatma sesi ve açılır bildirim gösterilmez; hatırlatıcı listen güncel kalır.
            </p>
          </div>
          <Switch checked={muted} onCheckedChange={toggleMuted} aria-label="Bildirimleri sessize al" />
        </div>

        <Button asChild variant="link" className="mt-2 h-auto px-0 text-xs">
          <Link href="/hatirlaticilar" className="gap-1">
            <BellRing className="h-3.5 w-3.5" /> Hatırlatıcı listesini aç
          </Link>
        </Button>
      </section>

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
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-card p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
            <User className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{name ?? 'Hesabım'}</p>
            <p className="truncate text-xs text-muted-foreground">{email ?? ''}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="mt-4 h-10 w-full gap-1.5 text-destructive hover:text-destructive"
          onClick={() => void signOut({ redirectTo: '/giris' })}
        >
          <LogOut className="h-4 w-4" /> Çıkış yap
        </Button>
      </section>
    </div>
  );
}
