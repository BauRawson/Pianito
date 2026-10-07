// Song notation parsing and conversion of beat-based songs into time-based charts.
import { parsePitch } from './music';

export interface NoteDef {
  /** MIDI pitch number. */
  pitch: number;
  /** Start time in beats from the beginning of the song. */
  beat: number;
  /** Duration in beats. */
  dur: number;
  /** Optional metadata (finger numbers, lyrics, …). */
  meta?: Record<string, unknown>;
}

export interface SongLike {
  bpm: number;
  timeSig: [number, number];
  notes: NoteDef[];
  accompaniment?: NoteDef[];
  vocalMelody?: NoteDef[];
}

/**
 * Compact notation used by the song data:
 *   "C4"          quarter note (1 beat)       "C4:2"   half note
 *   "C4+E4+G4:4"  chord held 4 beats          "R" / "R:2" / "-"  rests
 *   "|"           optional bar line (ignored; purely for readability)
 */
export function parseSeq(src: string, startBeat = 0): NoteDef[] {
  const out: NoteDef[] = [];
  let beat = startBeat;
  for (const tok of src.split(/\s+/)) {
    if (!tok || tok === '|') continue;
    const [p, d] = tok.split(':');
    const dur = d === undefined ? 1 : parseFloat(d);
    if (!(dur > 0)) throw new Error(`Invalid duration in "${tok}"`);
    if (p !== 'R' && p !== '-') {
      for (const part of p.split('+')) out.push({ pitch: parsePitch(part), beat, dur });
    }
    beat += dur;
  }
  return out;
}

/** Total length in beats of a notation string (including rests). */
export function seqBeats(src: string): number {
  let beats = 0;
  for (const tok of src.split(/\s+/)) {
    if (!tok || tok === '|') continue;
    const d = tok.split(':')[1];
    beats += d === undefined ? 1 : parseFloat(d);
  }
  return beats;
}

export interface ChartNote {
  /** Sequential index into Chart.notes (0..n-1). */
  id: number;
  pitch: number;
  /** Onset in seconds from beat 0. */
  time: number;
  /** Release time in seconds. */
  end: number;
  beat: number;
  beats: number;
  /** Long notes must be held until their end. */
  hold: boolean;
  /** Chord group id (notes sharing an onset), or -1 for single notes. */
  chord: number;
}

export interface AccompEvent { pitch: number; time: number; dur: number; instrument?: 'voice' }

export interface Chart {
  notes: ChartNote[];
  accomp: AccompEvent[];
  beatDur: number;
  beatsPerBar: number;
  /** Seconds until the last sound ends. */
  duration: number;
}

/** Notes this many beats or longer require holding. */
export const HOLD_MIN_BEATS = 2;
const EPS = 1e-6;

/** Groups notes that start together. Returns, per note index, a chord id or -1. */
export function groupChords(notes: { beat: number }[]): number[] {
  const ids = new Array<number>(notes.length).fill(-1);
  let group = 0;
  let i = 0;
  while (i < notes.length) {
    let j = i + 1;
    while (j < notes.length && Math.abs(notes[j].beat - notes[i].beat) < EPS) j++;
    if (j - i > 1) {
      for (let k = i; k < j; k++) ids[k] = group;
      group++;
    }
    i = j;
  }
  return ids;
}

export function buildChart(song: SongLike, rate = 1): Chart {
  const beatDur = 60 / (song.bpm * rate);
  const sorted = [...song.notes].sort((a, b) => a.beat - b.beat || a.pitch - b.pitch);
  // Remove exact duplicates (same pitch, same onset) — they would be unplayable.
  const unique = sorted.filter((n, i) => i === 0 || !(n.pitch === sorted[i - 1].pitch && Math.abs(n.beat - sorted[i - 1].beat) < EPS));
  const chordIds = groupChords(unique);
  const notes: ChartNote[] = unique.map((n, i) => ({
    id: i,
    pitch: n.pitch,
    time: n.beat * beatDur,
    end: (n.beat + n.dur) * beatDur,
    beat: n.beat,
    beats: n.dur,
    hold: n.dur >= HOLD_MIN_BEATS - EPS,
    chord: chordIds[i],
  }));
  const accomp = (song.accompaniment ?? [])
    .map((n) => ({ pitch: n.pitch, time: n.beat * beatDur, dur: n.dur * beatDur }))
    .concat((song.vocalMelody ?? []).map((n) => ({ pitch: n.pitch, time: n.beat * beatDur, dur: n.dur * beatDur, instrument: 'voice' as const })))
    .sort((a, b) => a.time - b.time);
  const duration = Math.max(0, ...notes.map((n) => n.end), ...accomp.map((a) => a.time + a.dur));
  return { notes, accomp, beatDur, beatsPerBar: song.timeSig[0], duration };
}
