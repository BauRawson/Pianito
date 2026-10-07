// User preferences, persisted locally with change notification.
import type { KV } from './progress';
import type { Naming } from './music';

export type Lang = 'en' | 'es';
export type LabelMode = 'both' | 'keys' | 'notes';
export type TriState = 'auto' | 'on' | 'off';

export interface Settings {
  lang: Lang;
  masterVolume: number;   // 0..1
  musicVolume: number;    // accompaniment
  metronomeVolume: number;
  muted: boolean;
  /** 1 (slow, lots of reading time) … 10 (fast). */
  noteSpeed: number;
  labels: LabelMode;
  naming: 'auto' | Naming;
  sheetMusic: TriState;
  metronome: boolean;
  /** Positive when the player tends to press late (subtracted from press times). */
  inputOffsetMs: number;
  reducedMotion: TriState;
}

export function defaultSettings(): Settings {
  const navLang = typeof navigator !== 'undefined' ? navigator.language : 'en';
  return {
    lang: navLang.toLowerCase().startsWith('es') ? 'es' : 'en',
    masterVolume: 0.8,
    musicVolume: 0.6,
    metronomeVolume: 0.5,
    muted: false,
    noteSpeed: 4,
    labels: 'both',
    naming: 'auto',
    sheetMusic: 'auto',
    metronome: false,
    inputOffsetMs: 0,
    reducedMotion: 'auto',
  };
}

/** Seconds a note is visible before reaching the judgment line. */
export function lookaheadFor(speed: number): number {
  const s = Math.min(10, Math.max(1, speed));
  return 3.4 - (s - 1) * 0.27;
}

const KEY = 'pianito.settings.v1';

export class SettingsStore {
  private value: Settings;
  private listeners = new Set<(s: Settings) => void>();

  constructor(private store: KV | null) {
    this.value = defaultSettings();
    try {
      const raw = store?.getItem(KEY);
      if (raw) this.value = { ...this.value, ...(JSON.parse(raw) as Partial<Settings>) };
    } catch { /* ignore corrupt settings */ }
  }

  get(): Readonly<Settings> { return this.value; }

  set(patch: Partial<Settings>): void {
    this.value = { ...this.value, ...patch };
    try { this.store?.setItem(KEY, JSON.stringify(this.value)); } catch { /* ignore */ }
    this.listeners.forEach((l) => l(this.value));
  }

  subscribe(fn: (s: Settings) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  naming(): Naming {
    const n = this.value.naming;
    return n === 'auto' ? (this.value.lang === 'es' ? 'solfege' : 'letter') : n;
  }

  reducedMotion(): boolean {
    const r = this.value.reducedMotion;
    if (r !== 'auto') return r === 'on';
    return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
