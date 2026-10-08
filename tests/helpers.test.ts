import { describe, expect, it } from 'vitest';
import { bassLine, pianoPart } from '../src/data/helpers';
import { MIDI_TO_KEY } from '../src/core/keymap';

describe('pop piano reductions', () => {
  it.each([4, 6, 12])('keeps split chords, rests and bass aligned in a %i-unit bar', (meter) => {
    const progression = 'C,G R F,Am Cmaj7';
    const notes = pianoPart(progression, 'arpeggio', meter);
    const bass = bassLine(progression, meter);
    expect(Math.max(...notes.map((n) => n.beat + n.dur))).toBe(meter * 4);
    expect(Math.max(...bass.map((n) => n.beat + n.dur))).toBe(meter * 4);
    expect(bass.map((n) => n.beat)).toEqual([0, meter / 2, meter * 2, meter * 2.5, meter * 3]);
    for (const n of notes) {
      expect(MIDI_TO_KEY[n.pitch]).toBeDefined();
      expect(n.dur).toBeGreaterThan(0);
      expect(n.beat < meter || n.beat >= meter * 2).toBe(true);
      // Neither a bar boundary nor a mid-bar chord change may bisect a note.
      const nextBoundary = (Math.floor((n.beat + 1e-6) / (meter / 2)) + 1) * meter / 2;
      expect(n.beat + n.dur).toBeLessThanOrEqual(nextBoundary);
    }
  });

  it('clips syncopated and held chords at split-bar changes', () => {
    for (const pattern of ['syncopated', 'ballad'] as const) {
      const notes = pianoPart('C,G F', pattern);
      for (const n of notes.filter((n) => n.beat < 2)) expect(n.beat + n.dur).toBeLessThanOrEqual(2);
      expect(notes.some((n) => n.beat === 2)).toBe(true);
      expect(Math.max(...notes.map((n) => n.beat + n.dur))).toBe(8);
    }
  });
});
