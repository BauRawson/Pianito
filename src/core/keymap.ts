// Computer-keyboard → piano mapping, modelled on common virtual-piano software.
// Uses KeyboardEvent.code (physical key position), so the layout stays musically
// identical across QWERTY/QWERTZ/AZERTY; labels adapt to the user's layout when the
// browser exposes it (navigator.keyboard.getLayoutMap).
//
//   Home row  A S D F G H J K L ; '   → white keys C4 D4 E4 F4 G4 A4 B4 C5 D5 E5 F5
//   Top row    W E   T Y U   O P      → black keys C♯4 D♯4 F♯4 G♯4 A♯4 C♯5 D♯5
//   Bottom row Z X C V B N M          → lower octave white keys C3 … B3

export const KEY_TO_MIDI: Readonly<Record<string, number>> = Object.freeze({
  KeyZ: 48, KeyX: 50, KeyC: 52, KeyV: 53, KeyB: 55, KeyN: 57, KeyM: 59,
  KeyA: 60, KeyW: 61, KeyS: 62, KeyE: 63, KeyD: 64, KeyF: 65, KeyT: 66,
  KeyG: 67, KeyY: 68, KeyH: 69, KeyU: 70, KeyJ: 71, KeyK: 72, KeyO: 73,
  KeyL: 74, KeyP: 75, Semicolon: 76, Quote: 77,
});

export const MIDI_TO_KEY: Readonly<Record<number, string>> = Object.freeze(
  Object.fromEntries(Object.entries(KEY_TO_MIDI).map(([code, midi]) => [midi, code])),
);

export const KEYBOARD_RANGE = { lo: 48, hi: 77 } as const;

const FALLBACK_LABELS: Record<string, string> = { Semicolon: ';', Quote: "'" };
let layoutLabels: Map<string, string> | null = null;

export function keyLabel(code: string): string {
  const fromLayout = layoutLabels?.get(code);
  if (fromLayout && fromLayout.trim()) return fromLayout.toUpperCase();
  return FALLBACK_LABELS[code] ?? code.replace(/^Key/, '');
}

export function labelForMidi(m: number): string | undefined {
  const code = MIDI_TO_KEY[m];
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
