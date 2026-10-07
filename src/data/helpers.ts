// Accompaniment builders. Chords are voiced around C3 so they sit below the melody.
import type { NoteDef } from '../core/chart';

const CHORDS: Record<string, { bass: number; tones: number[] }> = {
  C: { bass: 36, tones: [48, 52, 55] },
  Dm: { bass: 38, tones: [50, 53, 57] },
  D: { bass: 38, tones: [50, 54, 57] },
  Em: { bass: 40, tones: [47, 52, 55] },
  E: { bass: 40, tones: [47, 52, 56] },
  F: { bass: 41, tones: [48, 53, 57] },
  G: { bass: 43, tones: [47, 50, 55] },
  G7: { bass: 43, tones: [47, 50, 53] },
  Am: { bass: 45, tones: [48, 52, 57] },
  A: { bass: 45, tones: [49, 52, 57] },
  A7: { bass: 45, tones: [49, 52, 55] },
  Bm: { bass: 47, tones: [50, 54, 59] },
  B: { bass: 47, tones: [51, 54, 59] },
  Cm: { bass: 36, tones: [48, 51, 55] },
  Fm: { bass: 41, tones: [48, 53, 56] },
  Ab: { bass: 44, tones: [48, 51, 56] },
  Dm7: { bass: 38, tones: [48, 53, 57] },
};

/** Splits "C F | G C" into bars; a bar "C,G" splits it in halves. */
function bars(src: string): string[] {
  return src.split(/[\s|]+/).filter(Boolean);
}

function chordsInBar(bar: string, beatsPerBar: number): { name: string; beat: number; len: number }[] {
  const parts = bar.split(',');
  const len = beatsPerBar / parts.length;
  return parts.map((name, i) => ({ name, beat: i * len, len }));
}

/** "Oom-pah" pattern: bass on strong beats, chord on the others. */
export function oompah(progression: string, beatsPerBar = 4, startBeat = 0): NoteDef[] {
  const out: NoteDef[] = [];
  bars(progression).forEach((bar, bi) => {
    const barStart = startBeat + bi * beatsPerBar;
    for (const ch of chordsInBar(bar, beatsPerBar)) {
      if (ch.name === 'R') continue;
      const c = CHORDS[ch.name];
      if (!c) throw new Error(`Unknown chord ${ch.name}`);
      for (let b = 0; b < ch.len; b++) {
        const beat = barStart + ch.beat + b;
        const strong = beatsPerBar === 3 ? b === 0 : b % 2 === 0;
        if (strong) out.push({ pitch: b === 2 && beatsPerBar === 4 ? c.bass + 7 : c.bass, beat, dur: 0.9 });
        else for (const p of c.tones) out.push({ pitch: p, beat, dur: 0.6 });
      }
    }
  });
  return out;
}

/** Sustained whole-bar chords — gentle backing for slow lessons. */
export function pads(progression: string, beatsPerBar = 4, startBeat = 0): NoteDef[] {
  const out: NoteDef[] = [];
  bars(progression).forEach((bar, bi) => {
    for (const ch of chordsInBar(bar, beatsPerBar)) {
      if (ch.name === 'R') continue;
      const c = CHORDS[ch.name];
      if (!c) throw new Error(`Unknown chord ${ch.name}`);
      const beat = startBeat + bi * beatsPerBar + ch.beat;
      out.push({ pitch: c.bass, beat, dur: ch.len });
      for (const p of c.tones) out.push({ pitch: p, beat, dur: ch.len * 0.95 });
    }
  });
  return out;
}

/** Repeats a notation string n times. */
export const rep = (s: string, n: number): string => Array.from({ length: n }, () => s).join(' ');
