// Validates every lesson and arcade song is real, playable content.
import { describe, it, expect } from 'vitest';
import { LESSONS, WORLDS } from '../src/data/lessons';
import { ARCADE } from '../src/data/arcade';
import { buildChart } from '../src/core/chart';
import { Judge } from '../src/core/judge';
import { KEYBOARD_RANGE, MIDI_TO_KEY } from '../src/core/keymap';
import { isBlack } from '../src/core/music';

const ALL = [...LESSONS, ...ARCADE];

describe('content', () => {
  it('has at least 20 lessons across all 6 worlds', () => {
    expect(LESSONS.length).toBeGreaterThanOrEqual(20);
    for (const w of WORLDS) expect(LESSONS.some((l) => l.world === w.id)).toBe(true);
  });

  it('has unique ids', () => {
    const ids = ALL.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('is ordered by world', () => {
    const worlds = LESSONS.map((l) => l.world);
    expect([...worlds].sort((a, b) => a - b)).toEqual(worlds);
  });

  for (const s of ALL) {
    describe(s.id, () => {
      it('has bilingual text', () => {
        expect(s.title.en && s.title.es).toBeTruthy();
        expect(s.objective.en && s.objective.es).toBeTruthy();
        if ('intro' in s) {
          const l = s as (typeof LESSONS)[number];
          expect(l.intro.en.length).toBeGreaterThan(0);
          expect(l.intro.es.length).toBe(l.intro.en.length);
          for (const f of l.focus) expect(MIDI_TO_KEY[f]).toBeDefined();
        }
      });

      it('only uses notes playable on the computer keyboard', () => {
        expect(s.notes.length).toBeGreaterThan(8);
        for (const n of s.notes) {
          expect(n.pitch).toBeGreaterThanOrEqual(KEYBOARD_RANGE.lo);
          expect(n.pitch).toBeLessThanOrEqual(KEYBOARD_RANGE.hi);
          expect(MIDI_TO_KEY[n.pitch]).toBeDefined();
        }
      });

      it('has a sane tempo, meter and length', () => {
        expect(s.bpm).toBeGreaterThanOrEqual(60);
        expect(s.bpm).toBeLessThanOrEqual(160);
        const chart = buildChart(s);
        expect(chart.duration).toBeGreaterThan(8);
        expect(chart.duration).toBeLessThan(120);
        // Accompaniment must cover the final bar of the melody (catches bar-count typos).
        const bpb = s.timeSig[0];
        const lastBeat = Math.max(...s.notes.map((n) => n.beat + n.dur));
        const songEnd = Math.ceil(lastBeat / bpb - 1e-6) * bpb;
        if (s.accompaniment) {
          const accEnd = Math.max(...s.accompaniment.map((n) => n.beat + n.dur));
          expect(accEnd).toBeLessThanOrEqual(songEnd + 0.01);
          expect(accEnd).toBeGreaterThan(songEnd - bpb + 0.01);
        }
        if (s.vocalMelody) {
          expect(s.vocalMelody.length).toBeGreaterThan(8);
          for (const n of s.vocalMelody) {
            expect(Number.isFinite(n.pitch)).toBe(true);
            expect(n.beat).toBeGreaterThanOrEqual(0);
            expect(n.dur).toBeGreaterThan(0);
            expect(n.beat + n.dur).toBeLessThanOrEqual(songEnd + 0.01);
          }
          // The guide is automatic; every one of its events must reach the backing scheduler.
          expect(chart.accomp.filter((n) => n.instrument === 'voice')).toHaveLength(s.vocalMelody.length);
        }
      });

      it('can be completed with a perfect score by a simulated player', () => {
        const chart = buildChart(s);
        const judge = new Judge(chart.notes);
        type Ev = { t: number; on: boolean; p: number };
        const evs: Ev[] = [];
        for (const n of chart.notes) {
          evs.push({ t: n.time, on: true, p: n.pitch });
          evs.push({ t: n.hold ? n.end : Math.min(n.end, n.time + 0.1), on: false, p: n.pitch });
        }
        evs.sort((a, b) => a.t - b.t || (a.on === b.on ? 0 : a.on ? 1 : -1));
        for (const e of evs) {
          judge.update(e.t);
          if (e.on) judge.press(e.p, e.t); else judge.release(e.p, e.t);
        }
        judge.update(chart.duration + 1);
        expect(judge.done()).toBe(true);
        expect(judge.miss).toBe(0);
        expect(judge.score).toBe(1_000_000);
      });
    });
  }

  it('introduces black keys only from World 4 on', () => {
    for (const l of LESSONS.filter((x) => x.world < 4)) {
      expect(l.notes.some((n) => isBlack(n.pitch))).toBe(false);
    }
  });

  it('introduces chords only from World 5 on', () => {
    for (const l of LESSONS.filter((x) => x.world < 5)) {
      expect(buildChart(l).notes.some((n) => n.chord >= 0)).toBe(false);
    }
  });
});
