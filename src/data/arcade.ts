// Arcade songs: fuller arrangements with accompaniment, tuned for score chasing.
import { parseSeq } from '../core/chart';
import { oompah, pads } from './helpers';
import type { Song } from './types';

const ORIGINAL = { en: 'Pianito original', es: 'Original de Pianito' };
const TRAD = { en: 'Traditional', es: 'Tradicional' };
const BEETHOVEN = { en: 'L. van Beethoven', es: 'L. van Beethoven' };

const odeA = 'E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | E4:1.5 D4:.5 D4:2 | E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | D4:1.5 C4:.5 C4:2';
const odeB = 'D4 D4 E4 C4 | D4 E4:.5 F4:.5 E4 C4 | D4 E4:.5 F4:.5 E4 D4 | C4 D4 G3:2 | E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | D4:1.5 C4:.5 C4:2';

const SONGS: Song[] = [
  // ── Pop favourites: short, simplified excerpts, transposed for the keyboard.
  // Pitch references and arrangement notes are listed in README.md.
  {
    id: 'arc-somewhere-only-we-know', difficulty: 2, bpm: 86, timeSig: [4, 4],
    credit: { en: 'Keane — Tim Rice-Oxley, Tom Chaplin & Richard Hughes', es: 'Keane — Tim Rice-Oxley, Tom Chaplin y Richard Hughes' },
    title: { en: 'Somewhere Only We Know (excerpt)', es: 'Somewhere Only We Know (fragmento)' },
    objective: { en: 'A verse and chorus in C: repeated notes, short pickups and wide leaps.', es: 'Estrofa y estribillo en Do: notas repetidas, entradas cortas y saltos amplios.' },
    notes: parseSeq('R:2 C4:.5 G4:.5 G4:.5 E4:.5 | E4 E4:.5 E4:.5 E4:2 | F4 F4:.5 F4:.5 F4 F4 | F4:.5 F4:.5 F4:.5 E4:.5 D4:.5 E4:.5 F4:.5 E4:.5 | R:2 C4:.5 G4:.5 G4:.5 E4:.5 | E4 E4:.5 E4:.5 F4 E4 | F4 F4:.5 F4:.5 F4 F4 | F4:.5 F4:.5 F4 E4:.5 D4:.5 F4:.5 E4:.5 | E4 C5 C5 A4 | E4 G4 G4 E4 | F3 F4 F4 F4 | F4:.5 F4:.5 F4:.5 F4:.5 E4:.5 D4:.5 E4:.5 F4:.5 | E4 C5 C5 A4 | E4 E4:.5 E4:.5 G4 G4 | F4 F4:.5 F4:.5 F4 E4 | D4 E4:.5 F4:.5 E4:2'),
    accompaniment: pads('C C Dm G C C Dm G Am Em F G Am Em F G,C'),
  },
  {
    id: 'arc-angels', difficulty: 3, bpm: 76, timeSig: [4, 4],
    credit: { en: 'Robbie Williams — Robbie Williams & Guy Chambers', es: 'Robbie Williams — Robbie Williams y Guy Chambers' },
    title: { en: 'Angels (excerpt)', es: 'Angels (fragmento)' },
    objective: { en: 'A ballad in C: leave space between phrases, then climb into the chorus.', es: 'Una balada en Do: deja espacio entre frases y sube al estribillo.' },
    notes: parseSeq('C4 E4 D4 C4 | E4:.5 G4:.5 A4:.5 G4:.5 E4:.5 G4:.5 A4:.5 G4:.5 | G4:2 R:2 | C4 E4 D4 C4 | C4:.5 E4:.5 D4:.5 E4:.5 D4 E4 | E4 D4 E4 G4 | G4:2 R:2 | C4 E4 D4 C4 | C4 E4 G4 D5 | D5 D5:.5 C5:.5 D5 C5 | E5 D5:3 | C5 C5:.5 C5:.5 C5 C5 | A4 D5 C5:2 | A4 A4 A4 A4 | G4 G4:3 | C4:4'),
    accompaniment: pads('C F G C F F G C G G Dm Dm F F C C'),
  },
  {
    id: 'arc-the-scientist', difficulty: 2, bpm: 76, timeSig: [4, 4],
    credit: { en: 'Coldplay — Chris Martin, Jonny Buckland, Guy Berryman & Will Champion', es: 'Coldplay — Chris Martin, Jonny Buckland, Guy Berryman y Will Champion' },
    title: { en: 'The Scientist (verse)', es: 'The Scientist (estrofa)' },
    objective: { en: 'A slow verse in C: return to the same phrase over changing chords.', es: 'Una estrofa lenta en Do: repite la frase sobre acordes que cambian.' },
    notes: parseSeq('C4:.5 D4:.5 C4 G4 E4 | E4:2 R:2 | C4:.5 D4:.5 C4 G4 E4 | E4:2 R:2 | G3:.5 C4:.5 D4:.5 C4:.5 E4 E4 | E4 E4 D4 C4 | C4:2 R:2 | R:4 | C4:.5 D4:.5 C4 G4 E4 | E4:2 R:2 | C4:.5 D4:.5 C4 G4 E4 | E4:2 R:2 | C4:.5 D4:.5 C4 E4 E4 | E4 E4 D4 C4 | C4:4 | C4:4'),
    accompaniment: pads('Am Am F F C C C C Am Am F F C C C C'),
  },
  {
    id: 'arc-clocks', difficulty: 4, bpm: 120, timeSig: [4, 4],
    credit: { en: 'Coldplay — Chris Martin, Jonny Buckland, Guy Berryman & Will Champion', es: 'Coldplay — Chris Martin, Jonny Buckland, Guy Berryman y Will Champion' },
    title: { en: 'Clocks (piano riff)', es: 'Clocks (riff de piano)' },
    objective: { en: 'The piano hook in G: steady eighth notes grouped 3 + 3 + 2. Start slowly.', es: 'El motivo de piano en Sol: corcheas constantes agrupadas 3 + 3 + 2. Empieza despacio.' },
    notes: parseSeq(Array(4).fill('G4:.5 D4:.5 B3:.5 G4:.5 D4:.5 B3:.5 G4:.5 D4:.5 | F4:.5 D4:.5 A3:.5 F4:.5 D4:.5 A3:.5 F4:.5 D4:.5 | F4:.5 D4:.5 A3:.5 F4:.5 D4:.5 A3:.5 F4:.5 D4:.5 | E4:.5 C4:.5 A3:.5 E4:.5 C4:.5 A3:.5 E4:.5 C4:.5').join(' | ') + ' | G4:4'),
    accompaniment: pads(Array(4).fill('G Dm Dm Am').join(' ') + ' G'),
  },
  {
    id: 'arc-someone-like-you', difficulty: 3, bpm: 68, timeSig: [4, 4],
    credit: { en: 'Adele — Adele Adkins & Dan Wilson', es: 'Adele — Adele Adkins y Dan Wilson' },
    title: { en: 'Someone Like You (chorus)', es: 'Someone Like You (estribillo)' },
    objective: { en: 'A chorus in C: low melody notes, gentle syncopation and sustained endings.', es: 'Un estribillo en Do: melodía grave, síncopas suaves y finales sostenidos.' },
    notes: parseSeq('C4:.5 C4:.5 C4 B3 B3 | A3:2 R:2 | A3:.5 B3:.5 B3:.5 C4:.5 A3:2 | R:4 | A3 B3 C4:.5 G3:.5 G3 | C4 B3 B3:.5 C4:.5 A3 | C4:2 R:2 | R:4 | E4 E4:.5 E4:.5 E4 G4 | E4:2 R:2 | F4:.5 E4:.5 D4 C4 E4 | E4 D4:.5 C4:.5 A3:2 | C4 C4 C4 C4 | G3 G3:3 | G3 A3 G3 G3 | A3 A3:3'),
    accompaniment: pads('C G Am F C G Am F C G Am F C G Am F'),
  },
  // ── Popular classics & sing-alongs (all public domain; original simplified arrangements)
  {
    id: 'arc-happy-birthday', difficulty: 1, bpm: 100, timeSig: [3, 4], credit: { en: 'Mildred & Patty Hill', es: 'Mildred y Patty Hill' },
    title: { en: 'Happy Birthday', es: 'Cumpleaños feliz' },
    objective: { en: 'The song everyone knows — mind the short pickup notes.', es: 'La canción que todos conocen: cuidado con las notas cortas de entrada.' },
    notes: parseSeq('R:2 G3:.75 G3:.25 | A3 G3 C4 | B3:2 G3:.75 G3:.25 | A3 G3 D4 | C4:2 G3:.75 G3:.25 | G4 E4 C4 | B3 A3 F4:.75 F4:.25 | E4 C4 D4 | C4:3'),
    accompaniment: oompah('R C G7 G7 C C F C,G7 C', 3),
  },
  {
    id: 'arc-london-bridge', difficulty: 1, bpm: 108, timeSig: [4, 4], credit: TRAD,
    title: { en: 'London Bridge', es: 'London Bridge' },
    objective: { en: 'A bouncy nursery rhyme with a dotted start.', es: 'Una canción infantil saltarina con inicio con puntillo.' },
    notes: parseSeq('G4:1.5 A4:.5 G4 F4 | E4 F4 G4:2 | D4 E4 F4:2 | E4 F4 G4:2 | G4:1.5 A4:.5 G4 F4 | E4 F4 G4:2 | D4:2 G4:2 | E4 C4:3'),
    accompaniment: oompah('C C G C C C G C'),
  },
  {
    id: 'arc-old-macdonald', difficulty: 1, bpm: 112, timeSig: [4, 4], credit: TRAD,
    title: { en: 'Old MacDonald Had a Farm', es: 'En la granja de mi tío' },
    objective: { en: 'E-I-E-I-O! Steps down into the low octave.', es: '¡I-A-I-A-O! Baja a la octava grave.' },
    notes: parseSeq('C4 C4 C4 G3 | A3 A3 G3:2 | E4 E4 D4 D4 | C4:3 G3 | C4 C4 C4 G3 | A3 A3 G3:2 | E4 E4 D4 D4 | C4:4'),
    accompaniment: oompah('C F,C G C C F,C G C'),
  },
  {
    id: 'arc-auld-lang-syne', difficulty: 2, bpm: 92, timeSig: [4, 4], credit: { en: 'Scottish traditional', es: 'Tradicional escocesa' },
    title: { en: 'Auld Lang Syne', es: 'Auld Lang Syne (Canción de la despedida)' },
    objective: { en: 'The New Year\'s Eve classic: dotted rhythms and a big leap.', es: 'El clásico de Año Nuevo: puntillos y un gran salto.' },
    notes: parseSeq('R:3 G3 | C4:1.5 C4:.5 C4 E4 | D4:1.5 C4:.5 D4 E4 | C4:1.5 C4:.5 E4 G4 | A4:3 A4 | G4:1.5 E4:.5 E4 C4 | D4:1.5 C4:.5 D4 E4 | C4:1.5 A3:.5 A3 G3 | C4:4'),
    accompaniment: oompah('R C G C F C G F,G C'),
  },
  {
    id: 'arc-silent-night', difficulty: 2, bpm: 96, timeSig: [3, 4], credit: { en: 'Franz Xaver Gruber (1818)', es: 'Franz Xaver Gruber (1818)' },
    title: { en: 'Silent Night', es: 'Noche de paz' },
    objective: { en: 'A gentle 3/4 carol with long held notes.', es: 'Un villancico suave en 3/4 con notas largas.' },
    notes: parseSeq('G4:1.5 A4:.5 G4 | E4:3 | G4:1.5 A4:.5 G4 | E4:3 | D5:2 D5 | B4:3 | C5:2 C5 | G4:3 | A4:2 A4 | C5:1.5 B4:.5 A4 | G4:1.5 A4:.5 G4 | E4:3 | A4:2 A4 | C5:1.5 B4:.5 A4 | G4:1.5 A4:.5 G4 | E4:3 | D5:2 D5 | F5:1.5 D5:.5 B4 | C5:3 | E5:3 | C5:1.5 G4:.5 E4 | G4:1.5 F4:.5 D4 | C4:3 | C4:3'),
    accompaniment: pads('C C C C G G C C F F C C F F C C G G C C C G C C', 3),
  },
  {
    id: 'arc-canon', difficulty: 2, bpm: 76, timeSig: [4, 4], credit: { en: 'Johann Pachelbel', es: 'Johann Pachelbel' },
    title: { en: 'Canon in D (in C)', es: 'Canon en Re (en Do)' },
    objective: { en: 'The wedding favourite: slow descending lines, then flowing quarters.', es: 'El favorito de las bodas: líneas lentas que bajan y luego negras fluidas.' },
    notes: parseSeq('E5:2 D5:2 | C5:2 B4:2 | A4:2 G4:2 | A4:2 B4:2 | C5:2 B4:2 | A4:2 G4:2 | F4:2 E4:2 | F4:2 D4:2 | C4 E4 G4 F4 | E4 C4 E4 D4 | C4 A3 C4 G4 | F4 A4 G4 F4 | E4 C4 D4 B4 | C5 E5 D5 C5 | B4 A4 G4 E4 | F4 A4 G4 B4 | C5:4'),
    accompaniment: pads('C,G Am,Em F,C F,G C,G Am,Em F,C F,G C,G Am,Em F,C F,G C,G Am,Em F,C F,G C'),
  },
  {
    id: 'arc-beethoven-5', difficulty: 3, bpm: 108, timeSig: [4, 4], credit: BEETHOVEN,
    title: { en: 'Symphony No. 5', es: 'Sinfonía n.º 5' },
    objective: { en: 'Da-da-da-DUM! Start right after the rest, then hold.', es: '¡Ta-ta-ta-TAN! Entra justo después del silencio y mantén.' },
    notes: parseSeq('R:.5 G4:.5 G4:.5 G4:.5 D#4:2 | R:.5 F4:.5 F4:.5 F4:.5 D4:2 | R:.5 G4:.5 G4:.5 G4:.5 D#4:2 | R:.5 G#4:.5 G#4:.5 G#4:.5 G4:2 | R:.5 D#5:.5 D#5:.5 D#5:.5 C5:2 | R:.5 G4:.5 G4:.5 G4:.5 D4:2 | R:.5 G#4:.5 G#4:.5 G#4:.5 G4:2 | R:.5 F4:.5 F4:.5 F4:.5 D4:2 | C4:4'),
    accompaniment: pads('Cm G Cm Ab Cm G Fm G Cm'),
  },
  {
    id: 'arc-mountain-king', difficulty: 3, bpm: 104, timeSig: [4, 4], credit: { en: 'Edvard Grieg', es: 'Edvard Grieg' },
    title: { en: 'In the Hall of the Mountain King', es: 'En la gruta del rey de la montaña' },
    objective: { en: 'Sneaky eighth notes with two black keys — repeat and build.', es: 'Corcheas sigilosas con dos teclas negras: repite y crece.' },
    notes: parseSeq(Array(4).fill('E4:.5 F#4:.5 G4:.5 A4:.5 B4:.5 G4:.5 B4 | A#4:.5 F#4:.5 A#4 A4:.5 F4:.5 A4 | E4:.5 F#4:.5 G4:.5 A4:.5 B4:.5 G4:.5 B4:.5 E5:.5 | D5:.5 B4:.5 G4:.5 B4:.5 D5:2').join(' | ') + ' | E4+B4:4'),
    accompaniment: pads(Array(4).fill('Em B Em G').join(' ') + ' Em'),
  },
  {
    id: 'arc-nachtmusik', difficulty: 3, bpm: 120, timeSig: [4, 4], credit: { en: 'W. A. Mozart', es: 'W. A. Mozart' },
    title: { en: 'Eine kleine Nachtmusik', es: 'Pequeña serenata nocturna' },
    objective: { en: 'Mozart\'s famous opening: crisp, separated notes.', es: 'El famoso inicio de Mozart: notas nítidas y separadas.' },
    notes: parseSeq(Array(2).fill('G4 R:.5 D4:.5 G4 R:.5 D4:.5 | G4:.5 D4:.5 G4:.5 B4:.5 D5:2 | C5 R:.5 A4:.5 C5 R:.5 A4:.5 | C5:.5 A4:.5 F#4:.5 A4:.5 D4:2').join(' | ') + ' | G4:4'),
    accompaniment: pads('G G D D G G D D G'),
  },
  {
    id: 'arc-turkish-march', difficulty: 4, bpm: 96, timeSig: [4, 4], credit: { en: 'W. A. Mozart — in D minor', es: 'W. A. Mozart — en Re menor' },
    title: { en: 'Turkish March (opening)', es: 'Marcha turca (inicio)' },
    objective: { en: 'Fast turns around a note, with semitone steps.', es: 'Giros rápidos alrededor de una nota, con semitonos.' },
    notes: parseSeq(Array(2).fill('E4:.5 D4:.5 C#4:.5 D4:.5 F4:2 | G4:.5 F4:.5 E4:.5 F4:.5 A4:2 | A#4:.5 A4:.5 G#4:.5 A4:.5 E5:.5 D5:.5 C#5:.5 D5:.5 | E5:.5 D5:.5 C#5:.5 D5:.5 F5:2').join(' | ') + ' | A4:.5 G4:.5 F4:.5 E4:.5 D4:2'),
    accompaniment: pads('Dm Dm Dm Dm Dm Dm Dm Dm A,Dm'),
  },
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

/** Sorted easiest → hardest so the list reads as a difficulty ladder. */
export const ARCADE: Song[] = [...SONGS].sort((a, b) => a.difficulty - b.difficulty);

export const arcadeById = (id: string): Song | undefined => ARCADE.find((s) => s.id === id);
