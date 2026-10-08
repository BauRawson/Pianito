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
  Cmaj7: { bass: 36, tones: [52, 55, 59] },
  Fmaj7: { bass: 41, tones: [52, 53, 57] },
  Am7: { bass: 45, tones: [48, 52, 55] },
  Em7: { bass: 40, tones: [47, 50, 55] },
  C7: { bass: 36, tones: [52, 55, 58] },
  Gsus4: { bass: 43, tones: [48, 50, 55] },
  Csus2: { bass: 36, tones: [48, 50, 55] },
  Fsus2: { bass: 41, tones: [48, 53, 55] },
  Dsus2: { bass: 38, tones: [50, 52, 57] },
  Gm: { bass: 43, tones: [50, 55, 58] },
  Bb: { bass: 46, tones: [50, 53, 58] },
  Eb: { bass: 39, tones: [51, 55, 58] },
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

/** Playable piano reduction. In compound meters, durations/BPM count eighth-note units. */
export function pianoPart(progression: string, pattern: 'pulse' | 'ballad' | 'arpeggio' | 'rocking' | 'syncopated', beatsPerBar = 4): NoteDef[] {
  const out: NoteDef[] = [];
  const compound = beatsPerBar === 6 || beatsPerBar === 12;
  const arpeggio = compound ? [0, 1, 2, 1, 2, 1] : [0, 1, 2, 1];
  const step = pattern === 'arpeggio' ? (compound ? 1 : 0.5) : pattern === 'rocking' ? 0.5 : pattern === 'ballad' ? (compound ? 3 : 2) : 1;
  bars(progression).forEach((bar, bi) => {
    for (const ch of chordsInBar(bar, beatsPerBar)) {
      if (ch.name === 'R') continue;
      const chord = CHORDS[ch.name];
      if (!chord) throw new Error(`Unknown chord ${ch.name}`);
      const tones = chord.tones.map((p) => p + 12);
      let offset = 0;
      for (let i = 0; offset < ch.len; i++) {
        const duration = pattern === 'syncopated' ? [1.5, 0.5, 1, 1][i % 4] : step;
        const pitches = pattern === 'arpeggio' ? [tones[arpeggio[i % arpeggio.length]]]
          : pattern === 'rocking' ? [tones[i % 2 === 0 ? 2 : 0]] : tones;
        for (const pitch of pitches) out.push({ pitch, beat: bi * beatsPerBar + ch.beat + offset, dur: Math.min(duration, ch.len - offset) });
        offset += duration;
      }
    }
  });
  return out;
}

/** Automatic bass support without doubling the piano part the player performs. */
export function bassLine(progression: string, beatsPerBar = 4): NoteDef[] {
  const out: NoteDef[] = [];
  bars(progression).forEach((bar, bi) => {
    for (const ch of chordsInBar(bar, beatsPerBar)) {
      if (ch.name === 'R') continue;
      const chord = CHORDS[ch.name];
      if (!chord) throw new Error(`Unknown chord ${ch.name}`);
      out.push({ pitch: chord.bass, beat: bi * beatsPerBar + ch.beat, dur: ch.len });
    }
  });
  return out;
}
