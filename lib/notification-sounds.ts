export type ToneCategory = 'Klasik' | 'Yumuşak' | 'Doğa' | 'Dijital' | 'Melodi';

export type TonePreset = {
  id: string;
  name: string;
  category: ToneCategory;
  wave: OscillatorType;
  speed?: number;
  pattern: string;
};

type ToneDef = Omit<TonePreset, 'id'>;

const DEFS: ToneDef[] = [
  { name: 'Ding', category: 'Klasik', wave: 'sine', pattern: 'C6' },
  { name: 'Dong', category: 'Klasik', wave: 'sine', speed: 0.8, pattern: 'G5 C5' },
  { name: 'Çift zil', category: 'Klasik', wave: 'triangle', pattern: 'E5 C5' },
  { name: 'Kapı zili', category: 'Klasik', wave: 'sine', pattern: 'E5 C5 E5' },
  { name: 'Okul zili', category: 'Klasik', wave: 'triangle', speed: 1.2, pattern: 'C5 E5 G5 C6 G5 E5 C5' },
  { name: 'Klasik çan', category: 'Klasik', wave: 'sine', speed: 0.9, pattern: 'G5 E5 C5' },
  { name: 'Büyük çan', category: 'Klasik', wave: 'sine', speed: 0.7, pattern: 'C5 G4 C5' },
  { name: 'Üçlü ding', category: 'Klasik', wave: 'sine', pattern: 'C6 E6 G6' },
  { name: 'Ağır çan', category: 'Klasik', wave: 'triangle', speed: 0.7, pattern: 'G4 C5 E5' },
  { name: 'Şapel çanı', category: 'Klasik', wave: 'sine', speed: 0.8, pattern: 'C5 - C5 G5' },

  { name: 'Ninni', category: 'Yumuşak', wave: 'sine', speed: 0.8, pattern: 'E5 D5 C5' },
  { name: 'Fısıltı', category: 'Yumuşak', wave: 'sine', speed: 0.7, pattern: 'G5 G5' },
  { name: 'Yağmur damlası', category: 'Yumuşak', wave: 'sine', pattern: 'A5 - E5' },
  { name: 'Yumuşak yükseliş', category: 'Yumuşak', wave: 'sine', speed: 0.9, pattern: 'C5 D5 E5 G5' },
  { name: 'Sakin dalga', category: 'Yumuşak', wave: 'triangle', pattern: 'C5 E5 G5 E5' },
  { name: 'Bahar', category: 'Yumuşak', wave: 'sine', pattern: 'D5 E5 G5 A5' },
  { name: 'Bulut', category: 'Yumuşak', wave: 'sine', speed: 0.8, pattern: 'G5 E5 G5' },
  { name: 'Uyku', category: 'Yumuşak', wave: 'sine', speed: 0.7, pattern: 'C5 G4 E4' },
  { name: 'Hafif dokunuş', category: 'Yumuşak', wave: 'triangle', speed: 0.9, pattern: 'E5 G5' },
  { name: 'Sessiz an', category: 'Yumuşak', wave: 'sine', speed: 0.8, pattern: 'C6 - G5 E5' },

  { name: 'Kuş cıvıltısı', category: 'Doğa', wave: 'sine', speed: 2.2, pattern: 'E6 G6 E6' },
  { name: 'Su damlası', category: 'Doğa', wave: 'sine', speed: 1.4, pattern: 'C6 A5 G5' },
  { name: 'Rüzgar', category: 'Doğa', wave: 'triangle', speed: 0.8, pattern: 'A4 C5 E5' },
  { name: 'Orman', category: 'Doğa', wave: 'sine', speed: 0.9, pattern: 'G4 A4 C5 A4' },
  { name: 'Çiçek açışı', category: 'Doğa', wave: 'sine', pattern: 'C5 E5 G5 C6' },
  { name: 'Yaprak', category: 'Doğa', wave: 'triangle', pattern: 'D5 G5 F5' },
  { name: 'Nehir', category: 'Doğa', wave: 'sine', speed: 1.1, pattern: 'C5 D5 E5 G5' },
  { name: 'Şafak', category: 'Doğa', wave: 'sine', speed: 0.8, pattern: 'G4 C5 E5 G5' },
  { name: 'Arı vızıltısı', category: 'Doğa', wave: 'square', speed: 2.5, pattern: 'A4 A4 A4' },
  { name: 'Deniz', category: 'Doğa', wave: 'triangle', speed: 0.9, pattern: 'C5 E5 D5 C5' },

  { name: 'Bip', category: 'Dijital', wave: 'square', pattern: 'A5' },
  { name: 'Çift bip', category: 'Dijital', wave: 'square', pattern: 'A5 A5' },
  { name: 'Üç bip', category: 'Dijital', wave: 'square', speed: 1.3, pattern: 'A5 A5 A5' },
  { name: 'Yükselen bip', category: 'Dijital', wave: 'square', pattern: 'A5 C6 E6' },
  { name: 'Alçalan bip', category: 'Dijital', wave: 'square', pattern: 'E6 C6 A5' },
  { name: 'Sinyal', category: 'Dijital', wave: 'square', speed: 1.2, pattern: 'E5 A5 E5' },
  { name: 'Radar', category: 'Dijital', wave: 'triangle', speed: 1.2, pattern: 'G5 C6 G5 C6' },
  { name: 'Robot', category: 'Dijital', wave: 'square', pattern: 'C5 G5 C5 G5' },
  { name: 'Kod', category: 'Dijital', wave: 'square', speed: 1.4, pattern: 'E5 G5 E5 C5' },
  { name: 'Uyarı', category: 'Dijital', wave: 'sawtooth', speed: 1.2, pattern: 'A5 E5 A5 E5' },

  { name: 'Do re mi', category: 'Melodi', wave: 'triangle', speed: 1.1, pattern: 'C5 D5 E5' },
  { name: 'Sol anahtarı', category: 'Melodi', wave: 'triangle', pattern: 'G4 C5 E5 G5' },
  { name: 'Minik vals', category: 'Melodi', wave: 'triangle', speed: 1.1, pattern: 'C5 E5 G5 E5 C5' },
  { name: 'Neşeli', category: 'Melodi', wave: 'triangle', speed: 1.2, pattern: 'E5 G5 E5 C5' },
  { name: 'Rondo', category: 'Melodi', wave: 'triangle', pattern: 'C5 E5 G5 C6' },
  { name: 'Fanfar', category: 'Melodi', wave: 'triangle', speed: 1.1, pattern: 'C5 G5 C6' },
  { name: 'Şarkı', category: 'Melodi', wave: 'sine', speed: 1.1, pattern: 'A5 G5 E5 D5' },
  { name: 'Marş', category: 'Melodi', wave: 'triangle', speed: 1.3, pattern: 'C5 C5 G4 G4 A4 A4 G4' },
  { name: 'Dans', category: 'Melodi', wave: 'triangle', speed: 1.3, pattern: 'D5 F5 A5 F5 D5' },
  { name: 'Final', category: 'Melodi', wave: 'triangle', speed: 1.2, pattern: 'C5 E5 G5 C6 G5 E5' },
];

export const TONES: TonePreset[] = DEFS.map((def, index) => ({
  ...def,
  id: `pl-${String(index + 1).padStart(2, '0')}`,
}));

export function getTone(id: string): TonePreset {
  return TONES.find((tone) => tone.id === id) ?? TONES[0];
}

const SEMITONES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function frequencyOf(note: string): number {
  const match = /^([A-G])(#?)(\d)$/.exec(note);
  if (!match) return 0;
  const semitone = SEMITONES[match[1]] + (match[2] ? 1 : 0);
  const octave = Number(match[3]);
  return 440 * 2 ** ((semitone - 9) / 12 + (octave - 4));
}

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioContext = new Ctor();
  }
  return audioContext;
}

/** Plays one of the 50 built-in tones; everything is synthesised, no audio files are downloaded. */
export async function playToneById(id: string, options?: { volume?: number }): Promise<void> {
  const tone = getTone(id);
  const volume = Math.min(100, Math.max(0, options?.volume ?? readSoundSettings().volume));
  if (volume === 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      return;
    }
  }

  const master = ctx.createGain();
  master.gain.value = (volume / 100) * 0.5;
  master.connect(ctx.destination);

  const step = 0.16 / (tone.speed ?? 1);
  let at = ctx.currentTime + 0.02;

  for (const token of tone.pattern.split(' ')) {
    if (token === '-') {
      at += step;
      continue;
    }
    const frequency = frequencyOf(token);
    if (!frequency) continue;
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    oscillator.type = tone.wave;
    oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(0.0001, at);
    envelope.gain.exponentialRampToValueAtTime(1, at + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + step * 0.95);
    oscillator.connect(envelope);
    envelope.connect(master);
    oscillator.start(at);
    oscillator.stop(at + step);
    at += step;
  }

  const totalMs = (at - ctx.currentTime + 0.15) * 1000;
  window.setTimeout(() => {
    try {
      master.disconnect();
    } catch {
      // context may already be closed
    }
  }, totalMs);
}

export type SoundSettings = {
  enabled: boolean;
  toneId: string;
  volume: number;
};

export const DEFAULT_SOUND_SETTINGS: SoundSettings = {
  enabled: true,
  toneId: 'pl-01',
  volume: 70,
};

const STORAGE_KEY = 'pl_notify_sound';

export function readSoundSettings(): SoundSettings {
  if (typeof window === 'undefined') return DEFAULT_SOUND_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SOUND_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<SoundSettings>;
    const toneId = typeof parsed.toneId === 'string' && TONES.some((tone) => tone.id === parsed.toneId) ? parsed.toneId : DEFAULT_SOUND_SETTINGS.toneId;
    const volume = typeof parsed.volume === 'number' && Number.isFinite(parsed.volume)
      ? Math.min(100, Math.max(0, Math.round(parsed.volume)))
      : DEFAULT_SOUND_SETTINGS.volume;
    return { enabled: parsed.enabled !== false, toneId, volume };
  } catch {
    return DEFAULT_SOUND_SETTINGS;
  }
}

export function saveSoundSettings(settings: SoundSettings): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // private mode: settings stay in memory for this session
  }
  window.dispatchEvent(new CustomEvent('pl:sound-settings', { detail: settings }));
}

/** Plays the user's chosen reminder sound if sounds are enabled. */
export function playNotificationSound(): void {
  const settings = readSoundSettings();
  if (!settings.enabled) return;
  void playToneById(settings.toneId, { volume: settings.volume });
}
