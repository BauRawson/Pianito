// Deterministic timing judge. Feed it presses/releases with song-time stamps (seconds)
// and call update(t) regularly; it emits judgement events. No clocks, no DOM.
import type { ChartNote } from './chart';

export type Grade = 'perfect' | 'great' | 'good' | 'miss';
export type HitGrade = Exclude<Grade, 'miss'>;

export interface Windows { perfect: number; great: number; good: number }
/** Half-widths in seconds. A press further than `good` from any note is ignored. */
export const DEFAULT_WINDOWS: Windows = { perfect: 0.05, great: 0.1, good: 0.15 };
export const GRADE_VALUE: Record<Grade, number> = { perfect: 1, great: 0.8, good: 0.5, miss: 0 };

export type HoldState = 'none' | 'holding' | 'ok' | 'broken';
export interface NoteState { grade: Grade | null; delta: number; hold: HoldState }

export type JudgeEvent =
  | { type: 'hit'; note: ChartNote; grade: HitGrade; delta: number }
  | { type: 'miss'; note: ChartNote }
  | { type: 'hold-ok'; note: ChartNote }
  | { type: 'hold-break'; note: ChartNote; frac: number }
  | { type: 'chord'; notes: ChartNote[] };

export interface JudgeStats {
  perfect: number; great: number; good: number; miss: number;
  combo: number; maxCombo: number;
  holdsOk: number; holdsBroken: number; chords: number;
  score: number; accuracy: number; meanDelta: number;
}

/** Releasing within this much of a hold's end (or 25% of its length) counts as complete. */
export function holdTolerance(n: ChartNote): number {
  return Math.min(0.2, (n.end - n.time) * 0.25);
}

export class Judge {
  readonly state: NoteState[];
  private cursor = 0;
  private holding = new Map<number, ChartNote>();
  private chordGroups = new Map<number, ChartNote[]>();
  private chordsDone = new Set<number>();
  private deltas: number[] = [];
  readonly totalPossible: number;
  private earned = 0;
  private judgedPossible = 0;
  perfect = 0; great = 0; good = 0; miss = 0;
  combo = 0; maxCombo = 0;
  holdsOk = 0; holdsBroken = 0; chords = 0;

  constructor(readonly notes: ChartNote[], readonly windows: Windows = DEFAULT_WINDOWS) {
    notes.forEach((n, i) => { if (n.id !== i) throw new Error('Chart note ids must be sequential'); });
    this.state = notes.map(() => ({ grade: null, delta: 0, hold: 'none' }));
    // Each note is worth 1; a hold's sustain is worth another 1.
    this.totalPossible = notes.reduce((s, n) => s + (n.hold ? 2 : 1), 0);
    for (const n of notes) {
      if (n.chord < 0) continue;
      const g = this.chordGroups.get(n.chord) ?? [];
      g.push(n);
      this.chordGroups.set(n.chord, g);
    }
  }

  press(pitch: number, t: number): JudgeEvent[] {
    const w = this.windows;
    let best: ChartNote | null = null;
    let bestAbs = Infinity;
    for (let i = this.cursor; i < this.notes.length; i++) {
      const n = this.notes[i];
      if (n.time - t > w.good) break;
      if (n.pitch !== pitch || this.state[i].grade) continue;
      const abs = Math.abs(t - n.time);
      if (abs <= w.good && abs < bestAbs) { best = n; bestAbs = abs; }
    }
    if (!best) return [];
    const delta = t - best.time;
    const grade: HitGrade = bestAbs <= w.perfect ? 'perfect' : bestAbs <= w.great ? 'great' : 'good';
    const s = this.state[best.id];
    s.grade = grade;
    s.delta = delta;
    this[grade]++;
    this.earned += GRADE_VALUE[grade];
    this.judgedPossible += 1;
    this.deltas.push(delta);
    this.bumpCombo();
    const events: JudgeEvent[] = [{ type: 'hit', note: best, grade, delta }];
    if (best.hold) {
      s.hold = 'holding';
      this.holding.set(pitch, best);
    }
    if (best.chord >= 0 && !this.chordsDone.has(best.chord)) {
      const group = this.chordGroups.get(best.chord)!;
      if (group.every((g) => { const gr = this.state[g.id].grade; return gr !== null && gr !== 'miss'; })) {
        this.chordsDone.add(best.chord);
        this.chords++;
        events.push({ type: 'chord', notes: group });
      }
    }
    return events;
  }

  release(pitch: number, t: number): JudgeEvent[] {
    const n = this.holding.get(pitch);
    if (!n) return [];
    this.holding.delete(pitch);
    if (t >= n.end - holdTolerance(n)) return [this.completeHold(n)];
    const frac = Math.min(1, Math.max(0, (t - n.time) / (n.end - n.time)));
    this.state[n.id].hold = 'broken';
    this.earned += frac * 0.5; // partial credit for the part that was held
    this.judgedPossible += 1;
    this.holdsBroken++;
    this.combo = 0;
    return [{ type: 'hold-break', note: n, frac }];
  }

  /** Advance judgement to song time t: completes holds and registers misses. */
  update(t: number): JudgeEvent[] {
    const events: JudgeEvent[] = [];
    for (const [pitch, n] of this.holding) {
      if (t >= n.end) {
        this.holding.delete(pitch);
        events.push(this.completeHold(n));
      }
    }
    while (this.cursor < this.notes.length && this.notes[this.cursor].time + this.windows.good < t) {
      const n = this.notes[this.cursor];
      const s = this.state[n.id];
      if (!s.grade) {
        s.grade = 'miss';
        this.miss++;
        this.combo = 0;
        this.judgedPossible += n.hold ? 2 : 1;
        events.push({ type: 'miss', note: n });
      }
      this.cursor++;
    }
    return events;
  }

  isHolding(pitch: number): boolean { return this.holding.has(pitch); }

  done(): boolean { return this.cursor >= this.notes.length && this.holding.size === 0; }

  /** 0..1,000,000 — fraction of the whole song's available points earned so far. */
  get score(): number {
    return this.totalPossible ? Math.round((1_000_000 * this.earned) / this.totalPossible) : 0;
  }

  /** 0..1 — accuracy over notes judged so far (equals final accuracy when done). */
  get accuracy(): number {
    return this.judgedPossible ? this.earned / this.judgedPossible : 1;
  }

  stats(): JudgeStats {
    const meanDelta = this.deltas.length ? this.deltas.reduce((a, b) => a + b, 0) / this.deltas.length : 0;
    return {
      perfect: this.perfect, great: this.great, good: this.good, miss: this.miss,
      combo: this.combo, maxCombo: this.maxCombo,
      holdsOk: this.holdsOk, holdsBroken: this.holdsBroken, chords: this.chords,
      score: this.score, accuracy: this.accuracy, meanDelta,
    };
  }

  private completeHold(n: ChartNote): JudgeEvent {
    this.state[n.id].hold = 'ok';
    this.earned += 1;
    this.judgedPossible += 1;
    this.holdsOk++;
    return { type: 'hold-ok', note: n };
  }

  private bumpCombo(): void {
    this.combo++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
  }
}
