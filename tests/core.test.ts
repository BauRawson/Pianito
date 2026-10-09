import { describe, it, expect } from 'vitest';
import { parsePitch, noteName, isBlack, staffPosition } from '../src/core/music';
import { keyMapFor, fitKeyboard, DEFAULT_BASE } from '../src/core/keymap';
const KEY_TO_MIDI = keyMapFor(DEFAULT_BASE).keyToMidi;
const MIDI_TO_KEY = keyMapFor(DEFAULT_BASE).midiToKey;
const KEYBOARD_RANGE = { lo: 60, hi: 77 };
import { parseSeq, seqBeats, buildChart, groupChords, HOLD_MIN_BEATS } from '../src/core/chart';
import { Judge, DEFAULT_WINDOWS } from '../src/core/judge';
import { Progress, starsFor, gradeFor, type KV } from '../src/core/progress';
import { lookaheadFor } from '../src/core/settings';
import { pianoLayout, rangeFor } from '../src/game/layout';

const song = (src: string, bpm = 60) => ({ bpm, timeSig: [4, 4] as [number, number], notes: parseSeq(src) });

describe('music theory', () => {
  it('parses pitches to MIDI', () => {
    expect(parsePitch('C4')).toBe(60);
    expect(parsePitch('A4')).toBe(69);
    expect(parsePitch('F#4')).toBe(66);
    expect(parsePitch('Bb3')).toBe(58);
    expect(parsePitch('C5')).toBe(72);
    expect(() => parsePitch('H2')).toThrow();
  });
  it('names notes in letters and solfège', () => {
    expect(noteName(60)).toBe('C4');
    expect(noteName(61)).toBe('C♯4');
    expect(noteName(67, 'solfege')).toBe('Sol4');
  });
  it('knows black keys', () => {
    expect([61, 63, 66, 68, 70].every(isBlack)).toBe(true);
    expect([60, 62, 64, 65, 67, 69, 71].some(isBlack)).toBe(false);
  });
  it('places notes on the staff', () => {
    expect(staffPosition(64).step).toBe(30); // E4 = bottom line of treble staff
    expect(staffPosition(77).step).toBe(38); // F5 = top line
    expect(staffPosition(66)).toEqual({ step: 31, sharp: true }); // F♯4 sits on the F space
  });
});

describe('keyboard mapping', () => {
  it('home row plays consecutive white keys from middle C', () => {
    const row = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK'].map((c) => KEY_TO_MIDI[c]);
    expect(row).toEqual([60, 62, 64, 65, 67, 69, 71, 72]);
    expect(row.some(isBlack)).toBe(false);
  });
  it('top row plays the black keys between them', () => {
    expect(['KeyW', 'KeyE', 'KeyT', 'KeyY', 'KeyU'].map((c) => KEY_TO_MIDI[c])).toEqual([61, 63, 66, 68, 70]);
    expect(['KeyW', 'KeyE', 'KeyT', 'KeyY', 'KeyU', 'KeyO', 'KeyP'].every((c) => isBlack(KEY_TO_MIDI[c]))).toBe(true);
  });
  it('is one-to-one and within range', () => {
    const pitches = Object.values(KEY_TO_MIDI);
    expect(new Set(pitches).size).toBe(pitches.length);
    for (const p of pitches) {
      expect(MIDI_TO_KEY[p]).toBeDefined();
      expect(p).toBeGreaterThanOrEqual(KEYBOARD_RANGE.lo);
      expect(p).toBeLessThanOrEqual(KEYBOARD_RANGE.hi);
    }
  });
});

describe('sliding keyboard window', () => {
  it('uses two rows only by default (no bottom row)', () => {
    expect(KEY_TO_MIDI.KeyZ).toBeUndefined();
    expect(KEY_TO_MIDI.KeyR).toBeUndefined(); // no black key between E and F
    expect(KEY_TO_MIDI.KeyI).toBeUndefined(); // nor between B and C
  });
  it('keeps the default window when the song fits it', () => {
    expect(fitKeyboard([60, 64, 67, 77])!.base).toBe(60);
  });
  it('slides down for low songs, with black keys still above their white neighbours', () => {
    const k = fitKeyboard([55, 57, 60, 67])!; // G3..G4
    expect(k.base).toBe(55);
    expect(k.keyToMidi.KeyA).toBe(55);
    expect(k.keyToMidi.KeyW).toBe(56); // G♯3 between G3 and A3
    expect(k.keyToMidi.KeyE).toBe(58); // A♯3
    expect(k.keyToMidi.KeyR).toBeUndefined(); // B3–C4: no black key
    expect(k.keyToMidi.KeyD).toBe(59);
    expect(k.keyToMidi.KeyF).toBe(60);
    expect(k.keyToMidi.KeyZ).toBeUndefined();
  });
  it('adds the bottom row only when two rows cannot fit the song', () => {
    const k = fitKeyboard([57, 60, 76])!; // A3..E5 (12 white keys)
    expect(k.keyToMidi.KeyN).toBe(57);
    expect(k.keyToMidi.KeyA).toBe(60);
  });
});

describe('notation and charts', () => {
  it('parses notes, rests and chords', () => {
    const n = parseSeq('C4 D4:2 R E4+G4:.5 | - C5');
    expect(n.map((x) => [x.pitch, x.beat, x.dur])).toEqual([
      [60, 0, 1], [62, 1, 2], [64, 4, 0.5], [67, 4, 0.5], [72, 5.5, 1],
    ]);
    expect(seqBeats('C4 D4:2 R E4+G4:.5 | - C5')).toBe(6.5);
  });
  it('converts beats to seconds using BPM', () => {
    const c = buildChart(song('C4 D4 E4:2', 120));
    expect(c.beatDur).toBeCloseTo(0.5);
    expect(c.notes.map((n) => n.time)).toEqual([0, 0.5, 1]);
    expect(c.notes[2].end).toBeCloseTo(2);
    expect(c.duration).toBeCloseTo(2);
  });
  it('applies tempo rate', () => {
    const c = buildChart(song('C4 D4', 60), 1.25);
    expect(c.notes[1].time).toBeCloseTo(0.8);
  });
  it('marks long notes as holds', () => {
    const c = buildChart(song(`C4 D4:${HOLD_MIN_BEATS} E4:4 F4:1.5`));
    expect(c.notes.map((n) => n.hold)).toEqual([false, true, true, false]);
  });
  it('detects chords by shared onset', () => {
    expect(groupChords([{ beat: 0 }, { beat: 1 }, { beat: 1 }, { beat: 1 }, { beat: 2 }, { beat: 3 }, { beat: 3 }])).toEqual([-1, 0, 0, 0, -1, 1, 1]);
    const c = buildChart(song('C4+E4+G4 D4 F4+A4'));
    expect(c.notes.map((n) => n.chord)).toEqual([0, 0, 0, -1, 1, 1]);
  });
  it('removes duplicate notes', () => {
    expect(buildChart(song('C4+C4')).notes).toHaveLength(1);
  });
  it('keeps vocal guides out of scored notes and scales all backing with tempo', () => {
    const source = {
      ...song('C4:4', 120),
      accompaniment: parseSeq('G3:2'),
      vocalMelody: parseSeq('R:2 E4:4'),
    };
    const chart = buildChart(source, 0.5);
    expect(chart.notes).toHaveLength(1);
    expect(chart.notes[0].pitch).toBe(60);
    expect(chart.accomp).toEqual([
      { pitch: 55, time: 0, dur: 2 },
      { pitch: 64, time: 2, dur: 4, instrument: 'voice' },
    ]);
    expect(chart.duration).toBe(6);
    expect(buildChart(source, 1.25).duration).toBeCloseTo(2.4);
  });
});

describe('timing judge', () => {
  const W = DEFAULT_WINDOWS;
  it('grades by distance from the onset', () => {
    const j = new Judge(buildChart(song('C4 C4 C4 C4 C4')).notes);
    expect(j.press(60, 0.0)[0]).toMatchObject({ type: 'hit', grade: 'perfect' });
    expect(j.press(60, 1 + W.perfect + 0.01)[0]).toMatchObject({ type: 'hit', grade: 'great' });
    expect(j.press(60, 2 - (W.great + 0.01))[0]).toMatchObject({ type: 'hit', grade: 'good' });
    expect(j.press(60, 3 + W.good + 0.02)).toEqual([]); // too late to count
    expect(j.press(60, 3.6)).toEqual([]); // stray press between notes is ignored
  });
  it('records signed deltas (early negative, late positive)', () => {
    const j = new Judge(buildChart(song('C4 D4')).notes);
    expect(j.press(60, -0.03)[0]).toMatchObject({ delta: -0.03 });
    expect((j.press(62, 1.04)[0] as { delta: number }).delta).toBeCloseTo(0.04);
    expect(j.stats().meanDelta).toBeCloseTo(0.005);
  });
  it('ignores wrong pitches', () => {
    const j = new Judge(buildChart(song('C4')).notes);
    expect(j.press(62, 0)).toEqual([]);
    expect(j.state[0].grade).toBeNull();
  });
  it('registers misses once the window has passed', () => {
    const j = new Judge(buildChart(song('C4 D4 E4')).notes);
    j.press(60, 0);
    expect(j.update(1 + W.good - 0.001)).toEqual([]);
    const ev = j.update(1 + W.good + 0.001);
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ type: 'miss' });
    expect(j.miss).toBe(1);
    expect(j.combo).toBe(0);
    j.update(10);
    expect(j.miss).toBe(2);
    expect(j.done()).toBe(true);
  });
  it('tracks combo and max combo', () => {
    const j = new Judge(buildChart(song('C4 C4 C4 C4')).notes);
    j.press(60, 0); j.press(60, 1); j.update(2.5); j.press(60, 3);
    expect(j.maxCombo).toBe(2);
    expect(j.combo).toBe(1);
  });
  it('matches the closest note when same-pitch notes are close together', () => {
    const j = new Judge(buildChart(song('C4:.25 C4:.25', 60)).notes); // 0.25 s apart
    const ev = j.press(60, 0.24);
    expect(ev[0]).toMatchObject({ type: 'hit', note: { id: 1 } });
  });
  it('scores deterministically to 1,000,000 for a perfect run', () => {
    const notes = buildChart(song('C4 D4 E4:2 C4+E4+G4')).notes;
    const run = () => {
      const j = new Judge(notes);
      j.press(60, 0); j.press(62, 1); j.press(64, 2); j.update(3.5);
      j.press(60, 4); j.press(64, 4.01); j.press(67, 3.99); j.update(10);
      return j.stats();
    };
    const a = run();
    expect(a.score).toBe(1_000_000);
    expect(a.accuracy).toBe(1);
    expect(run()).toEqual(a);
  });
});

describe('long notes', () => {
  const chart = () => buildChart(song('C4:4 D4'));
  it('completes a hold kept until the end', () => {
    const j = new Judge(chart().notes);
    j.press(60, 0);
    expect(j.isHolding(60)).toBe(true);
    expect(j.update(3.9)).toEqual([]);
    expect(j.update(4.0)[0]).toMatchObject({ type: 'hold-ok' });
    expect(j.holdsOk).toBe(1);
    expect(j.state[0].hold).toBe('ok');
  });
  it('accepts release within the tolerance before the end', () => {
    const j = new Judge(chart().notes);
    j.press(60, 0);
    expect(j.release(60, 3.85)[0]).toMatchObject({ type: 'hold-ok' });
  });
  it('breaks when released early, with partial credit', () => {
    const j = new Judge(chart().notes);
    j.press(60, 0);
    const ev = j.release(60, 1);
    expect(ev[0]).toMatchObject({ type: 'hold-break' });
    expect((ev[0] as { frac: number }).frac).toBeCloseTo(0.25);
    expect(j.combo).toBe(0);
    j.press(62, 4); j.update(10);
    // 3 possible points (hold head + tail + D4); earned 1 + 0.125 + 1.
    expect(j.accuracy).toBeCloseTo(2.125 / 3);
  });
  it('a missed hold head costs both head and tail', () => {
    const j = new Judge(chart().notes);
    j.update(5);
    expect(j.accuracy).toBe(0);
    expect(j.state[0].grade).toBe('miss');
  });
  it('is not done while a hold is still active', () => {
    const j = new Judge(buildChart(song('C4:4')).notes);
    j.press(60, 0);
    j.update(1);
    expect(j.done()).toBe(false);
    j.update(4);
    expect(j.done()).toBe(true);
  });
});

describe('chords', () => {
  it('emits a chord event when every note of the chord is hit', () => {
    const j = new Judge(buildChart(song('C4+E4+G4 D4')).notes);
    expect(j.press(60, 0.01).some((e) => e.type === 'chord')).toBe(false);
    expect(j.press(64, -0.02).some((e) => e.type === 'chord')).toBe(false);
    const ev = j.press(67, 0.03);
    expect(ev.find((e) => e.type === 'chord')).toBeDefined();
    expect(j.chords).toBe(1);
    expect(j.combo).toBe(3);
  });
  it('judges chord notes individually (ghosting-friendly)', () => {
    const j = new Judge(buildChart(song('C4+E4+G4')).notes);
    j.press(60, 0); j.press(64, 0); // third key "ghosted"
    j.update(1);
    expect(j.chords).toBe(0);
    expect(j.perfect).toBe(2);
    expect(j.miss).toBe(1);
  });
});

class MemKV implements KV {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

describe('progression', () => {
  it('awards stars and grades by accuracy', () => {
    expect([0.5, 0.6, 0.79, 0.8, 0.93, 1].map(starsFor)).toEqual([0, 1, 1, 2, 3, 3]);
    expect([1, 0.95, 0.85, 0.7, 0.3].map(gradeFor)).toEqual(['S', 'A', 'B', 'C', 'D']);
  });
  it('completes lessons at one star and keeps best results', () => {
    const p = new Progress(new MemKV());
    let o = p.record('l1', { score: 500_000, accuracy: 0.5, maxCombo: 3 });
    expect(o.firstClear).toBe(false);
    expect(p.isCompleted('l1')).toBe(false);
    o = p.record('l1', { score: 900_000, accuracy: 0.9, maxCombo: 12 });
    expect(o).toMatchObject({ newBest: true, firstClear: true, stars: 2 });
    o = p.record('l1', { score: 700_000, accuracy: 0.7, maxCombo: 5 });
    expect(o.newBest).toBe(false);
    expect(o.firstClear).toBe(false);
    expect(p.get('l1')).toMatchObject({ bestScore: 900_000, stars: 2, maxCombo: 12, plays: 3, completed: true });
  });
  it('recommends the first uncompleted lesson', () => {
    const p = new Progress(new MemKV());
    const ids = ['a', 'b', 'c'];
    expect(p.nextLesson(ids)).toBe('a');
    p.record('a', { score: 1, accuracy: 1, maxCombo: 1 });
    p.record('c', { score: 1, accuracy: 1, maxCombo: 1 });
    expect(p.nextLesson(ids)).toBe('b');
    p.record('b', { score: 1, accuracy: 0.65, maxCombo: 1 });
    expect(p.nextLesson(ids)).toBeUndefined();
    expect(p.totalStars(ids)).toBe(7);
  });
  it('persists across reloads and survives corrupt data', () => {
    const kv = new MemKV();
    const p = new Progress(kv);
    p.record('x', { score: 42, accuracy: 0.95, maxCombo: 9 });
    p.tutorialSeen = true;
    const reloaded = new Progress(kv);
    expect(reloaded.get('x')?.bestScore).toBe(42);
    expect(reloaded.tutorialSeen).toBe(true);
    kv.setItem('pianito.progress.v1', '{not json');
    expect(new Progress(kv).get('x')).toBeUndefined();
  });
});

describe('layout', () => {
  it('aligns lanes to the piano: white keys tile the width, black keys sit between', () => {
    const rects = pianoLayout(60, 71, 700);
    const whites = rects.filter((r) => !r.black);
    expect(whites).toHaveLength(7);
    expect(whites[0].x).toBe(0);
    expect(whites[6].x + whites[6].w).toBeCloseTo(700);
    const cs = rects.find((r) => r.midi === 61)!;
    expect(cs.x).toBeGreaterThan(whites[0].x);
    expect(cs.x + cs.w).toBeLessThan(whites[1].x + whites[1].w);
  });
  it('chooses a range covering the song', () => {
    expect(rangeFor([60, 62])).toEqual({ lo: 60, hi: 76 });
    expect(rangeFor([59, 77])).toEqual({ lo: 48, hi: 77 });
  });
  it('maps note speed to a sensible lookahead', () => {
    expect(lookaheadFor(1)).toBeGreaterThan(lookaheadFor(10));
    expect(lookaheadFor(10)).toBeGreaterThan(0.8);
  });
});
