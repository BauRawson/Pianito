import type { NoteDef } from '../core/chart';

/** Localised text. */
export interface L { en: string; es: string }

export interface Song {
  id: string;
  title: L;
  /** Composer / origin credit. All melodies are public domain or original. */
  credit: L;
  bpm: number;
  timeSig: [number, number];
  /** 1 (trivial) … 5 (challenging). */
  difficulty: number;
  objective: L;
  notes: NoteDef[];
  accompaniment?: NoteDef[];
}

export interface Lesson extends Song {
  world: number;
  /** Short explanation shown before playing (each entry is a paragraph). */
  intro: { en: string[]; es: string[] };
  /** Keys introduced in this lesson — highlighted, and the "try it" targets. */
  focus: number[];
  /** Show the sheet-music strip when the setting is "auto". */
  staff?: boolean;
  /** Metronome on by default for this lesson. */
  metronome?: boolean;
}

export interface World { id: number; title: L; blurb: L }
