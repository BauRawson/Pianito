// Arcade songs: fuller arrangements with accompaniment, tuned for score chasing.
import { parseSeq } from '../core/chart';
import { oompah, pads } from './helpers';
import type { Song } from './types';

const ORIGINAL = { en: 'Pianito original', es: 'Original de Pianito' };
const TRAD = { en: 'Traditional', es: 'Tradicional' };

const odeA = 'E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | E4:1.5 D4:.5 D4:2 | E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | D4:1.5 C4:.5 C4:2';
const odeB = 'D4 D4 E4 C4 | D4 E4:.5 F4:.5 E4 C4 | D4 E4:.5 F4:.5 E4 D4 | C4 D4 G3:2 | E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | D4:1.5 C4:.5 C4:2';

export const ARCADE: Song[] = [
  {
    id: 'arc-twinkle', difficulty: 1, bpm: 120, timeSig: [4, 4], credit: TRAD,
    title: { en: 'Twinkle Turbo', es: 'Estrellita Turbo' },
    objective: { en: 'Warm-up: the classic, up to speed.', es: 'Calentamiento: el clásico, a velocidad.' },
    notes: parseSeq('C4 C4 G4 G4 | A4 A4 G4:2 | F4 F4 E4 E4 | D4 D4 C4:2 | G4 G4 F4 F4 | E4 E4 D4:2 | G4 G4 F4 F4 | E4 E4 D4:2 | C4:.5 C4:.5 C4 G4:.5 G4:.5 G4 | A4:.5 A4:.5 A4:.5 A4:.5 G4:2 | F4:.5 F4:.5 F4 E4:.5 E4:.5 E4 | D4:.5 E4:.5 D4:.5 E4:.5 C4:2'),
    accompaniment: oompah('C F,C F,C G,C C,G C,G C,G C,G C F,C F,C G,C'),
  },
  {
    id: 'arc-ode', difficulty: 2, bpm: 112, timeSig: [4, 4], credit: { en: 'L. van Beethoven', es: 'L. van Beethoven' },
    title: { en: 'Ode to Joy — Full', es: 'Himno a la alegría — Completo' },
    objective: { en: 'The complete theme with its dotted rhythms and middle section.', es: 'El tema completo con ritmos con puntillo y sección central.' },
    notes: parseSeq(`${odeA} | ${odeB}`),
    accompaniment: oompah('C G C G,C C G C G,C | G G G G C G C G,C'),
  },
  {
    id: 'arc-jingle', difficulty: 2, bpm: 132, timeSig: [4, 4], credit: { en: 'J. L. Pierpont (1857)', es: 'J. L. Pierpont (1857)' },
    title: { en: 'Jingle Bells Express', es: 'Jingle Bells Exprés' },
    objective: { en: 'Fast repeated notes with a bouncing bass.', es: 'Notas repetidas rápidas con un bajo saltarín.' },
    notes: parseSeq('E4 E4 E4:2 | E4 E4 E4:2 | E4 G4 C4:1.5 D4:.5 | E4:4 | F4 F4 F4:1.5 F4:.5 | F4 E4 E4 E4:.5 E4:.5 | E4 D4 D4 E4 | D4:2 G4:2 | E4 E4 E4:2 | E4 E4 E4:2 | E4 G4 C4:1.5 D4:.5 | E4:4 | F4 F4 F4:1.5 F4:.5 | F4 E4 E4 E4:.5 E4:.5 | G4 G4 F4 D4 | C4+E4+G4:4'),
    accompaniment: oompah('C C C C F C G G C C C C F C G7 C'),
  },
  {
    id: 'arc-saints', difficulty: 3, bpm: 132, timeSig: [4, 4], credit: TRAD,
    title: { en: 'Saints Parade', es: 'Desfile de los Santos' },
    objective: { en: 'Swingy pickups and big held notes, with chords at the end.', es: 'Anacrusas con swing y notas largas, con acordes al final.' },
    notes: parseSeq('R C4 E4 F4 | G4:4 | R C4 E4 F4 | G4:4 | R C4 E4 F4 | G4:2 E4:2 | C4:2 E4:2 | D4:4 | R E4 E4 D4 | C4:3 C4 | E4:2 G4:2 | G4 F4:3 | R E4 F4 G4 | E4:2 C4:2 | D4:2 G4+B4+D5:2 | C4+E4+G4:4'),
    accompaniment: oompah('C C C C C C C G C C C F C C G C'),
  },
  {
    id: 'arc-minuet', difficulty: 3, bpm: 126, timeSig: [3, 4], credit: { en: 'C. Petzold (attr. J. S. Bach)', es: 'C. Petzold (atrib. J. S. Bach)' },
    title: { en: 'Minuet Waltz', es: 'Vals del Minueto' },
    objective: { en: 'Flowing eighth notes in 3/4.', es: 'Corcheas fluidas en 3/4.' },
    notes: parseSeq('G4 C4:.5 D4:.5 E4:.5 F4:.5 | G4 C4 C4 | A4 F4:.5 G4:.5 A4:.5 B4:.5 | C5 C4 C4 | F4 G4:.5 F4:.5 E4:.5 D4:.5 | E4 F4:.5 E4:.5 D4:.5 C4:.5 | B3 C4:.5 D4:.5 E4:.5 C4:.5 | D4:3 | G4 C4:.5 D4:.5 E4:.5 F4:.5 | G4 C4 C4 | A4 F4:.5 G4:.5 A4:.5 B4:.5 | C5 C4 C4 | F4 G4:.5 F4:.5 E4:.5 D4:.5 | E4 F4:.5 E4:.5 D4:.5 C4:.5 | D4 E4:.5 D4:.5 C4:.5 B3:.5 | C4:3'),
    accompaniment: oompah('C C F C G C G G C C F C G C G C', 3),
  },
  {
    id: 'arc-fur-elise', difficulty: 4, bpm: 84, timeSig: [3, 4], credit: { en: 'L. van Beethoven', es: 'L. van Beethoven' },
    title: { en: 'Für Elise', es: 'Para Elisa' },
    objective: { en: 'The full A section, twice through.', es: 'La sección A completa, dos veces.' },
    notes: parseSeq('R:2 E5:.5 D#5:.5 | E5:.5 D#5:.5 E5:.5 B4:.5 D5:.5 C5:.5 | A4:1.5 C4:.5 E4:.5 A4:.5 | B4:1.5 E4:.5 G#4:.5 B4:.5 | C5:1.5 E4:.5 E5:.5 D#5:.5 | E5:.5 D#5:.5 E5:.5 B4:.5 D5:.5 C5:.5 | A4:1.5 C4:.5 E4:.5 A4:.5 | B4:1.5 E4:.5 C5:.5 B4:.5 | A4:1.5 R:.5 E5:.5 D#5:.5 | E5:.5 D#5:.5 E5:.5 B4:.5 D5:.5 C5:.5 | A4:1.5 C4:.5 E4:.5 A4:.5 | B4:1.5 E4:.5 G#4:.5 B4:.5 | C5:1.5 E4:.5 E5:.5 D#5:.5 | E5:.5 D#5:.5 E5:.5 B4:.5 D5:.5 C5:.5 | A4:1.5 C4:.5 E4:.5 A4:.5 | B4:1.5 E4:.5 C5:.5 B4:.5 | A4:3'),
    accompaniment: pads('R R Am E Am R Am E Am R Am E Am R Am E Am', 3),
  },
  {
    id: 'arc-chord-rush', difficulty: 4, bpm: 116, timeSig: [4, 4], credit: ORIGINAL,
    title: { en: 'Chord Rush', es: 'Fiebre de acordes' },
    objective: { en: 'Syncopated C, F and G chords against a melody.', es: 'Acordes sincopados de Do, Fa y Sol contra una melodía.' },
    notes: parseSeq('C4+E4+G4 R:.5 C4+E4+G4:.5 R C4+E4+G4 | F4+A4+C5 R:.5 F4+A4+C5:.5 R F4+A4+C5 | G4+B4+D5 R:.5 G4+B4+D5:.5 R G4+B4+D5 | C4+E4+G4:2 R:2 | E4 G4 C5 G4 | F4 A4 C5 A4 | G4 B4 D5 B4 | C5:2 G4:2 | C4+E4+G4:.5 R:.5 C4+E4+G4:.5 R:.5 F4+A4+C5:.5 R:.5 F4+A4+C5:.5 R:.5 | G4+B4+D5:.5 R:.5 G4+B4+D5:.5 R:.5 C4+E4+G4:2 | E4:.5 F4:.5 G4:.5 A4:.5 G4:.5 F4:.5 E4:.5 D4:.5 | C4+E4+G4:4'),
    accompaniment: oompah('C F G C C F G C C,F G,C C C'),
  },
  {
    id: 'arc-chromatic', difficulty: 5, bpm: 120, timeSig: [4, 4], credit: ORIGINAL,
    title: { en: 'Chromatic Cascade', es: 'Cascada cromática' },
    objective: { en: 'Black and white keys at full speed.', es: 'Teclas negras y blancas a toda velocidad.' },
    notes: parseSeq('C4:.5 C#4:.5 D4:.5 D#4:.5 E4:.5 F4:.5 F#4:.5 G4:.5 | G#4:.5 A4:.5 A#4:.5 B4:.5 C5:2 | C5:.5 B4:.5 A#4:.5 A4:.5 G#4:.5 G4:.5 F#4:.5 F4:.5 | E4:.5 D#4:.5 D4:.5 C#4:.5 C4:2 | E4:.5 F4:.5 E4:.5 F4:.5 B4:.5 C5:.5 B4:.5 C5:.5 | F#4:.5 G4:.5 F#4:.5 G4:.5 C#5:.5 D5:.5 C#5:.5 D5:.5 | D#5:.5 E5:.5 D#5:.5 E5:.5 D#5 C5 | A4 G#4 A4:2 | C4+E4+G4 C#4+F4+G#4 D4+F#4+A4 D#4+G4+A#4 | E4+G#4+B4:2 C4+E4+G4+C5:2'),
    accompaniment: pads('C C C C C D Am E R C'),
  },
];

export const arcadeById = (id: string): Song | undefined => ARCADE.find((s) => s.id === id);
