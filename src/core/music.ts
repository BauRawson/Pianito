// Pure music-theory helpers. No DOM access, safe to unit test.

export const LETTER_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
export const SOLFEGE_NAMES = ['Do', 'Do♯', 'Re', 'Re♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'];
const BLACK = [false, true, false, true, false, false, true, false, true, false, true, false];

export type Naming = 'letter' | 'solfege';

export const pitchClass = (m: number): number => ((m % 12) + 12) % 12;
export const isBlack = (m: number): boolean => BLACK[pitchClass(m)];
export const octaveOf = (m: number): number => Math.floor(m / 12) - 1;
export const MIDDLE_C = 60;

export function noteName(m: number, naming: Naming = 'letter', withOctave = true): string {
  const base = (naming === 'solfege' ? SOLFEGE_NAMES : LETTER_NAMES)[pitchClass(m)];
  return withOctave ? `${base}${octaveOf(m)}` : base;
}

const LETTER_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Parses "C4", "F#3", "Bb4", "C♯5" into a MIDI number (C4 = 60). */
export function parsePitch(s: string): number {
  const m = /^([A-Ga-g])([#b♯♭]?)(-?\d)$/.exec(s.trim());
  if (!m) throw new Error(`Invalid pitch "${s}"`);
  let v = LETTER_PC[m[1].toUpperCase()];
  if (m[2] === '#' || m[2] === '♯') v++;
  else if (m[2] === 'b' || m[2] === '♭') v--;
  return v + (parseInt(m[3], 10) + 1) * 12;
}

export const midiToFreq = (m: number): number => 440 * Math.pow(2, (m - 69) / 12);

/** One colour per pitch class; white keys get a rainbow, black keys sit between neighbours. */
export const NOTE_COLORS = [
  '#ff4d6d', '#ff6f5e', '#ff8c42', '#ffb03b', '#ffd23f', '#5ccc6a',
  '#39c98f', '#22c3b5', '#33a9d9', '#4d8dff', '#7a74fa', '#a463f2',
];
export const noteColor = (m: number): string => NOTE_COLORS[pitchClass(m)];

/** Position on a staff: diatonic step count (C0 = 0) and whether a sharp sign is needed. */
export function staffPosition(m: number): { step: number; sharp: boolean } {
  const pc = pitchClass(m);
  const sharp = isBlack(m);
  const natural = sharp ? pc - 1 : pc;
  const letterIdx = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6][natural];
  return { step: letterIdx + octaveOf(m) * 7, sharp };
}

/** Next white key at or above m. */
export const whiteAtOrAbove = (m: number): number => (isBlack(m) ? m + 1 : m);
/** Nearest C at or below m. */
export const cAtOrBelow = (m: number): number => m - pitchClass(m);
