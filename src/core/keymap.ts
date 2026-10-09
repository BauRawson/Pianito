// Computer-keyboard → piano mapping, modelled on virtual-piano software, using only two rows:
//
//   Top row    W E R T Y U I O P [      → black keys (only where a black key exists)
//   Home row  A S D F G H J K L ; '     → 11 consecutive white keys
//
// The home row is a sliding window: by default A = middle C (C4 … F5), but each song shifts
// it so that every note it needs fits on these two rows (e.g. a song in G3–E4 starts at A = G3).
// Uses KeyboardEvent.code (physical position), so the shape is identical on QWERTY, QWERTZ,
// AZERTY and Spanish layouts (where ; ' print as Ñ ´); labels follow the user's layout when
// the browser exposes it.
import { isBlack, whiteAtOrAbove } from './music';

export const HOME_ROW = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote'] as const;
/** Fallback only, for the rare song wider than the two rows: an octave below the home row. */
export const BOTTOM_ROW = ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM'] as const;
/** TOP_ROW[i] sits between HOME_ROW[i] and HOME_ROW[i + 1]. */
export const TOP_ROW = ['KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft'] as const;

export const DEFAULT_BASE = 60; // A = middle C

export interface KeyMap {
  base: number;
  lo: number;
  hi: number;
  keyToMidi: Readonly<Record<string, number>>;
  midiToKey: Readonly<Record<number, string>>;
}

/** Builds the mapping whose home row starts on white key `base`. */
export function keyMapFor(base: number, lowRow = false): KeyMap {
  if (isBlack(base)) throw new Error('Keyboard base must be a white key');
  const whites: number[] = [];
  for (let m = base; whites.length < HOME_ROW.length; m++) if (!isBlack(m)) whites.push(m);
  const keyToMidi: Record<string, number> = {};
  HOME_ROW.forEach((code, i) => { keyToMidi[code] = whites[i]; });
  TOP_ROW.forEach((code, i) => { if (whites[i + 1] - whites[i] === 2) keyToMidi[code] = whites[i] + 1; });
  if (lowRow) BOTTOM_ROW.forEach((code, i) => { keyToMidi[code] = whites[i] - 12; });
  const midiToKey = Object.fromEntries(Object.entries(keyToMidi).map(([c, m]) => [m, c]));
  return { base, lo: lowRow ? whites[0] - 12 : whites[0], hi: whites[whites.length - 1], keyToMidi, midiToKey };
}

/**
 * The window that can play every pitch: prefers the default (A = C4), then a C-based
 * window, then the one closest to middle C. Only if no two-row window fits does it add the
 * bottom row (Z…M = the octave below A…J). Returns null if nothing fits.
 */
export function fitKeyboard(pitches: number[]): KeyMap | null {
  if (!pitches.length) return keyMapFor(DEFAULT_BASE);
  const fits = (k: KeyMap) => pitches.every((p) => k.midiToKey[p] !== undefined);
  const lo = Math.min(...pitches);
  const pick = (low: boolean): KeyMap | null => {
    const def = keyMapFor(DEFAULT_BASE, low);
    if (fits(def)) return def;
    const candidates: KeyMap[] = [];
    for (let b = whiteAtOrAbove(lo - 18); b <= lo + 12; b++) if (!isBlack(b)) candidates.push(keyMapFor(b, low));
    const ok = candidates.filter(fits);
    ok.sort((a, b) => Number(b.base % 12 === 0) - Number(a.base % 12 === 0) || Math.abs(a.base - 60) - Math.abs(b.base - 60));
    return ok[0] ?? null;
  };
  return pick(false) ?? pick(true);
}

let current: KeyMap = keyMapFor(DEFAULT_BASE);

export const currentKeyMap = (): KeyMap => current;
export function setKeyMap(k: KeyMap): void { current = k; }
export function resetKeyMap(): void { current = keyMapFor(DEFAULT_BASE); }
/** Shift the window by whole octaves (Free Play). */
export function shiftOctave(dir: 1 | -1): void {
  const b = current.base + dir * 12;
  if (b >= 36 && b <= 84) current = keyMapFor(b);
}

export const midiForCode = (code: string): number | undefined => current.keyToMidi[code];

const FALLBACK_LABELS: Record<string, string> = { Semicolon: ';', Quote: "'", BracketLeft: '[' };
let layoutLabels: Map<string, string> | null = null;

export function keyLabel(code: string): string {
  const fromLayout = layoutLabels?.get(code);
  if (fromLayout && fromLayout.trim()) return fromLayout.toUpperCase();
  return FALLBACK_LABELS[code] ?? code.replace(/^Key/, '');
}

export function labelForMidi(m: number): string | undefined {
  const code = current.midiToKey[m];
  return code ? keyLabel(code) : undefined;
}

/** Ask the browser for the real printed labels (Chromium only); harmless elsewhere. */
export async function loadLayoutLabels(): Promise<void> {
  try {
    const kb = (navigator as unknown as { keyboard?: { getLayoutMap?: () => Promise<Map<string, string>> } }).keyboard;
    if (kb?.getLayoutMap) layoutLabels = new Map(await kb.getLayoutMap());
  } catch {
    layoutLabels = null;
  }
}
