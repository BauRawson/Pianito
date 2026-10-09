// The Learn campaign: 6 worlds, 25 playable lessons.
// After three short warm-ups, every lesson is a real, recognisable song: knowing the tune
// makes the beat far easier to feel. Melodies are public domain, in original simplified
// arrangements. Tempos sit a little below natural speed early on and rise world by world.
import { parseSeq, type NoteDef } from '../core/chart';
import { oompah, pads } from './helpers';
import type { Lesson, World, L } from './types';

const ORIGINAL: L = { en: 'Pianito warm-up', es: 'Calentamiento de Pianito' };
const TRAD: L = { en: 'Traditional', es: 'Tradicional' };
const BEETHOVEN: L = { en: 'L. van Beethoven', es: 'L. van Beethoven' };

// ── Helpers for the chord world: the player plays chords, the melody is the backing.
const TRIADS: Record<string, string> = { C: 'C4+E4+G4', F: 'F4+A4+C5', G: 'G4+B4+D5' };

/** "C F,C G" → one chord per bar ("X,Y" splits a bar in halves), as playable notation. */
function chordPart(bars: string, beatsPerBar = 4): string {
  return bars.split(/[\s|]+/).filter(Boolean).map((bar) => {
    const parts = bar.split(',');
    const len = beatsPerBar / parts.length;
    return parts.map((c) => `${TRIADS[c]}:${len}`).join(' ');
  }).join(' | ');
}

const octaveUp = (notes: NoteDef[]): NoteDef[] => notes.map((n) => ({ ...n, pitch: n.pitch + 12 }));
const bassOnly = (notes: NoteDef[]): NoteDef[] => notes.filter((n) => n.pitch < 47);

// ── Melodies reused in more than one lesson.
const MARY = 'E4 D4 C4 D4 | E4 E4 E4:2 | D4 D4 D4:2 | E4 G4 G4:2 | E4 D4 C4 D4 | E4 E4 E4 E4 | D4 D4 E4 D4 | C4:4';
const TWINKLE = 'C4 C4 G4 G4 | A4 A4 G4:2 | F4 F4 E4 E4 | D4 D4 C4:2 | G4 G4 F4 F4 | E4 E4 D4:2 | G4 G4 F4 F4 | E4 E4 D4:2 | C4 C4 G4 G4 | A4 A4 G4:2 | F4 F4 E4 E4 | D4 D4 C4:2';
const TWINKLE_CHORDS = 'C F,C F,C G,C C,G C,G C,G C,G C F,C F,C G,C';
const FRERE = 'C4 D4 E4 C4 | C4 D4 E4 C4 | E4 F4 G4:2 | E4 F4 G4:2 | G4:.5 A4:.5 G4:.5 F4:.5 E4 C4 | G4:.5 A4:.5 G4:.5 F4:.5 E4 C4 | C4 G3 C4:2 | C4 G3 C4:2';
const JINGLE = 'E4 E4 E4:2 | E4 E4 E4:2 | E4 G4 C4 D4 | E4:4 | F4 F4 F4 F4 | F4 E4 E4 E4:.5 E4:.5 | E4 D4 D4 E4 | D4:2 G4:2 | E4 E4 E4:2 | E4 E4 E4:2 | E4 G4 C4 D4 | E4:4 | F4 F4 F4 F4 | F4 E4 E4 E4:.5 E4:.5 | G4 G4 F4 D4 | C4:4';
const JINGLE_CHORDS = 'C C C C F C G G C C C C F C G C';

export const WORLDS: World[] = [
  { id: 1, title: { en: 'Your First Notes', es: 'Tus primeras notas' }, blurb: { en: 'Find middle C, then C, D and E — and your first song.', es: 'Encuentra el Do central, luego Do, Re y Mi, y tu primera canción.' } },
  { id: 2, title: { en: 'The White Keys', es: 'Las teclas blancas' }, blurb: { en: 'All seven note names through five songs you already know.', es: 'Las siete notas a través de cinco canciones que ya conoces.' } },
  { id: 3, title: { en: 'Rhythm', es: 'Ritmo' }, blurb: { en: 'Long notes, rests, pickups and eighth notes — in famous songs.', es: 'Notas largas, silencios, anacrusas y corcheas, en canciones famosas.' } },
  { id: 4, title: { en: 'Sharps & Flats', es: 'Sostenidos y bemoles' }, blurb: { en: 'The black keys, heard inside real melodies.', es: 'Las teclas negras, dentro de melodías reales.' } },
  { id: 5, title: { en: 'Chords', es: 'Acordes' }, blurb: { en: 'Play the harmony while the melody sings along.', es: 'Toca la armonía mientras la melodía canta.' } },
  { id: 6, title: { en: 'Playing Music', es: 'Tocar música' }, blurb: { en: 'Faster, longer, livelier pieces — the whole keyboard.', es: 'Piezas más rápidas, largas y vivas, con todo el teclado.' } },
];

export const LESSONS: Lesson[] = [
  // ───────────────────────────── World 1 — three warm-ups, then songs
  {
    id: 'w1-middle-c', world: 1, difficulty: 1, bpm: 72, timeSig: [4, 4], credit: ORIGINAL,
    title: { en: 'Find Middle C', es: 'Encuentra el Do central' },
    objective: { en: 'Locate middle C and play it on the beat.', es: 'Ubica el Do central y tócalo a tiempo.' },
    intro: {
      en: ['Black keys come in groups of two and three. The white key just left of a group of TWO is always C.', 'The C nearest the middle of a piano is called middle C (C4). On your computer it is the A key.'],
      es: ['Las teclas negras vienen en grupos de dos y de tres. La tecla blanca justo a la izquierda de un grupo de DOS siempre es Do.', 'El Do más cercano al centro del piano se llama Do central (Do4). En tu computadora es la tecla A.'],
    },
    focus: [60], metronome: true,
    notes: parseSeq('C4 R C4 R | C4 R C4 R | C4 C4 C4 R | C4 C4 C4 R | C4 R C4 C4 | C4 R C4 R | C4 C4 C4 C4 | C4 R:3'),
    accompaniment: pads('C Am F C C Am F C'),
  },
  {
    id: 'w1-c-d', world: 1, difficulty: 1, bpm: 76, timeSig: [4, 4], credit: ORIGINAL,
    title: { en: 'C and D', es: 'Do y Re' },
    objective: { en: 'Move between two neighbouring keys.', es: 'Muévete entre dos teclas vecinas.' },
    intro: {
      en: ['D is the white key right after C, sitting between the two black keys. Press S.', 'Musical notes are named with letters A to G. Going right on the piano, they go up: C, D, E…'],
      es: ['Re es la tecla blanca justo después de Do, entre las dos teclas negras. Pulsa S.', 'Hacia la derecha del piano las notas suben: Do, Re, Mi… (en inglés se nombran con letras: C, D, E).'],
    },
    focus: [60, 62],
    notes: parseSeq('C4 D4 C4 D4 | C4 D4 C4 R | D4 D4 C4 R | C4 D4 C4 R | D4 C4 D4 C4 | D4 R C4 R | C4 C4 D4 D4 | C4 R:3'),
    accompaniment: pads('C G C C G G,C C C'),
  },
  {
    id: 'w1-c-d-e', world: 1, difficulty: 1, bpm: 80, timeSig: [4, 4], credit: ORIGINAL,
    title: { en: 'C, D, E', es: 'Do, Re, Mi' },
    objective: { en: 'Play three-note patterns up and down.', es: 'Toca patrones de tres notas subiendo y bajando.' },
    intro: {
      en: ['E is right of D, just after the two black keys. C, D and E are the three white keys around the group of two.', 'Your keys: A = C, S = D, D = E. After this warm-up, every lesson is a real song!'],
      es: ['Mi está a la derecha de Re, justo después de las dos teclas negras. Do, Re y Mi rodean al grupo de dos.', 'Tus teclas: A = Do, S = Re, D = Mi. ¡Después de este calentamiento, cada lección es una canción real!'],
    },
    focus: [60, 62, 64],
    notes: parseSeq('C4 D4 E4 R | E4 D4 C4 R | C4 D4 E4 D4 | C4 R:3 | E4 E4 D4 D4 | C4 D4 E4 R | E4 D4 C4 D4 | C4 R:3'),
    accompaniment: pads('C C C,G C C G,C C,G C'),
  },
  {
    id: 'w1-hot-cross-buns', world: 1, difficulty: 1, bpm: 88, timeSig: [4, 4], credit: TRAD,
    title: { en: 'Hot Cross Buns', es: 'Hot Cross Buns' },
    objective: { en: 'Your first song: keep a steady beat.', es: 'Tu primera canción: mantén un pulso constante.' },
    intro: {
      en: ['Rhythm is WHEN notes happen. Music has a steady pulse called the beat — the metronome clicks once per beat.', 'This nursery tune only uses E, D and C. Sing it in your head and let the song tell you when to press.'],
      es: ['El ritmo es CUÁNDO suenan las notas. La música tiene un pulso constante: el metrónomo hace clic en cada pulso.', 'Esta canción infantil solo usa Mi, Re y Do. Cántala mentalmente y deja que la canción te diga cuándo pulsar.'],
    },
    focus: [64, 62, 60], metronome: true,
    notes: parseSeq('E4 D4 C4 R | E4 D4 C4 R | C4 C4 C4 C4 | D4 D4 D4 D4 | E4 D4 C4 R | E4 D4 C4 R | C4 C4 D4 D4 | E4 D4 C4 R'),
    accompaniment: oompah('C C C G C C C,G C'),
  },
  // ───────────────────────────── World 2 — the white keys, one song at a time
  {
    id: 'w2-au-clair', world: 2, difficulty: 1, bpm: 88, timeSig: [4, 4], credit: TRAD,
    title: { en: 'Au Clair de la Lune', es: 'Au Clair de la Lune' },
    objective: { en: 'Hold half notes for two full beats.', es: 'Mantén las blancas dos pulsos completos.' },
    intro: {
      en: ['A quarter note lasts 1 beat; a half note lasts 2.', 'Long blocks with a stripe must be HELD: press when the block arrives and keep holding until its white end-cap reaches the line. Still only C, D and E!'],
      es: ['Una negra dura 1 pulso; una blanca dura 2.', 'Los bloques largos con franja se MANTIENEN: pulsa cuando llegue el bloque y no sueltes hasta que su tapa blanca toque la línea. ¡Todavía solo Do, Re y Mi!'],
    },
    focus: [60, 62, 64],
    notes: parseSeq('C4 C4 C4 D4 | E4:2 D4:2 | C4 E4 D4 D4 | C4:4 | C4 C4 C4 D4 | E4:2 D4:2 | C4 E4 D4 D4 | C4:4'),
    accompaniment: oompah('C C,G C,G C C C,G C,G C'),
  },
  {
    id: 'w2-mary', world: 2, difficulty: 1, bpm: 92, timeSig: [4, 4], credit: TRAD,
    title: { en: 'Mary Had a Little Lamb', es: 'Mary Had a Little Lamb' },
    objective: { en: 'Add G — your first jump.', es: 'Añade Sol: tu primer salto.' },
    intro: {
      en: ['F sits just left of the group of THREE black keys, and G comes right after it.', 'This song jumps from E up to G (key G). Find it before it arrives!'],
      es: ['Fa está justo a la izquierda del grupo de TRES teclas negras, y Sol va justo después.', 'Esta canción salta de Mi a Sol (tecla G). ¡Búscala antes de que llegue!'],
    },
    focus: [67],
    notes: parseSeq(MARY),
    accompaniment: oompah('C C G C C C G C'),
  },
  {
    id: 'w2-ode', world: 2, difficulty: 2, bpm: 96, timeSig: [4, 4], credit: BEETHOVEN, staff: true,
    title: { en: 'Ode to Joy', es: 'Himno a la alegría' },
    objective: { en: 'Five notes, C to G, moving step by step.', es: 'Cinco notas, de Do a Sol, paso a paso.' },
    intro: {
      en: ['Beethoven\'s "Ode to Joy" uses C D E F G — a five-finger "hand position" pianists use all the time.', 'Above the highway you\'ll now see the same notes on a music staff. Hollow note heads are half notes.'],
      es: ['El "Himno a la alegría" de Beethoven usa Do Re Mi Fa Sol: una "posición de cinco dedos" que los pianistas usan constantemente.', 'Arriba verás ahora las mismas notas en un pentagrama. Las cabezas huecas son blancas.'],
    },
    focus: [65, 67],
    notes: parseSeq('E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | E4 D4 D4:2 | E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | D4 C4 C4:2'),
    accompaniment: oompah('C G C G C G C G,C'),
  },
  {
    id: 'w2-twinkle', world: 2, difficulty: 2, bpm: 96, timeSig: [4, 4], credit: TRAD, staff: true,
    title: { en: 'Twinkle Twinkle Little Star', es: 'Estrellita, ¿dónde estás?' },
    objective: { en: 'Meet A, and leap from C up to G.', es: 'Conoce La y salta de Do a Sol.' },
    intro: {
      en: ['After G the letters start again at A (key H). Twinkle reaches up to A on "little star".', 'The opening leap C → G is a classic: your hand jumps four keys.'],
      es: ['Después de Sol viene La (tecla H). Estrellita llega hasta La en "dónde estás".', 'El salto inicial Do → Sol es un clásico: tu mano salta cuatro teclas.'],
    },
    focus: [60, 67, 69],
    notes: parseSeq(TWINKLE),
    accompaniment: oompah(TWINKLE_CHORDS),
  },
  {
    id: 'w2-joy-to-the-world', world: 2, difficulty: 2, bpm: 96, timeSig: [4, 4], credit: { en: 'Lowell Mason / G. F. Handel', es: 'Lowell Mason / G. F. Händel' }, staff: true,
    title: { en: 'Joy to the World', es: 'Joy to the World (Al mundo paz)' },
    objective: { en: 'Run down a whole octave: C B A G F E D C.', es: 'Baja una octava entera: Do Si La Sol Fa Mi Re Do.' },
    intro: {
      en: ['Eight white keys from one C to the next make an octave. The high C is key K; B (key J) is just below it.', 'This carol opens with the C major scale sliding all the way down — you already know how it sounds!'],
      es: ['Ocho teclas blancas de un Do al siguiente forman una octava. El Do agudo es la tecla K; Si (tecla J) está justo debajo.', 'Este villancico empieza con la escala de Do mayor bajando entera. ¡Ya sabes cómo suena!'],
    },
    focus: [72, 71, 69],
    notes: parseSeq('C5:2 B4:1.5 A4:.5 | G4:3 F4 | E4:2 D4:2 | C4:3 G4 | A4:3 A4 | B4:3 B4 | C5:3 C5 | C5 B4 A4 G4 | G4:1.5 F4:.5 E4 E4 | E4 E4 E4 E4:.5 F4:.5 | G4:3 F4:.5 E4:.5 | D4 D4 D4 D4:.5 E4:.5 | F4:3 E4:.5 D4:.5 | C4 C5:2 A4 | G4:1.5 F4:.5 E4 F4 | E4:2 D4:2 | C4:4'),
    accompaniment: pads('C C G7 C F G C C C C G7 G7 G7 C,F C,G7 C,G7 C'),
  },
  // ───────────────────────────── World 3 — rhythm
  {
    id: 'w3-amazing-grace', world: 3, difficulty: 2, bpm: 84, timeSig: [3, 4], credit: TRAD, staff: true,
    title: { en: 'Amazing Grace', es: 'Sublime gracia' },
    objective: { en: 'Feel 3/4 time and hold long notes.', es: 'Siente el compás de 3/4 y mantén notas largas.' },
    intro: {
      en: ['This hymn is in 3/4: three beats per bar — strong, weak, weak. Count "1, 2, 3".', 'It starts low on G and A — below middle C, so your keyboard slides down for this song. Hold every long note to its end.'],
      es: ['Este himno está en 3/4: tres pulsos por compás, fuerte-débil-débil. Cuenta "1, 2, 3".', 'Empieza grave en Sol y La — por debajo del Do central, así que tu teclado se desplaza en esta canción. Mantén cada nota larga hasta el final.'],
    },
    focus: [55, 57, 60],
    notes: parseSeq('R:2 G3 | C4:2 E4:.5 C4:.5 | E4:2 D4 | C4:2 A3 | G3:2 G3 | C4:2 E4:.5 C4:.5 | E4:2 D4 | G4:3 | G4:2 E4 | G4:2 E4:.5 C4:.5 | E4:2 D4 | C4:2 A3 | G3:2 G3 | C4:2 E4:.5 C4:.5 | E4:2 D4 | C4:3'),
    accompaniment: pads('R C C F C C G G C C G F C C G C', 3),
  },
  {
    id: 'w3-saints', world: 3, difficulty: 2, bpm: 100, timeSig: [4, 4], credit: TRAD, staff: true, metronome: true,
    title: { en: 'When the Saints Go Marching In', es: 'When the Saints Go Marching In' },
    objective: { en: 'Rests and pickups: start on beat 2.', es: 'Silencios y anacrusas: empieza en el pulso 2.' },
    intro: {
      en: ['A rest is a beat where you do NOT play — but the beat keeps going.', 'Every "Oh when the saints" starts after a rest on beat 1. Feel the empty beat, then go!'],
      es: ['Un silencio es un pulso en el que NO tocas, pero el pulso sigue.', 'Cada "Oh when the saints" empieza tras un silencio en el pulso 1. ¡Siente el pulso vacío y entra!'],
    },
    focus: [60, 64, 65, 67],
    notes: parseSeq('R C4 E4 F4 | G4:4 | R C4 E4 F4 | G4:4 | R C4 E4 F4 | G4:2 E4:2 | C4:2 E4:2 | D4:4 | R E4 E4 D4 | C4:3 C4 | E4:2 G4:2 | G4 F4:3 | R E4 F4 G4 | E4:2 C4:2 | D4:2 D4 C4 | C4:4'),
    accompaniment: oompah('C C C C C C C G C C C F C C G C'),
  },
  {
    id: 'w3-frere-jacques', world: 3, difficulty: 3, bpm: 96, timeSig: [4, 4], credit: TRAD, staff: true, metronome: true,
    title: { en: 'Frère Jacques', es: 'Martinillo (Frère Jacques)' },
    objective: { en: 'Eighth notes: two notes per beat.', es: 'Corcheas: dos notas por pulso.' },
    intro: {
      en: ['An eighth note lasts half a beat — two fit in each click. Count "1-and, 2-and".', '"Morning bells are ringing" is four quick eighths. It ends on a low G, below middle C — the keyboard slides down to reach it.'],
      es: ['Una corchea dura medio pulso: caben dos en cada clic. Cuenta "1-y, 2-y".', '"Suenan las campanas" son cuatro corcheas rápidas. Termina en un Sol grave, por debajo del Do central: el teclado se desplaza para alcanzarlo.'],
    },
    focus: [67, 69, 55],
    notes: parseSeq(FRERE),
    accompaniment: oompah('C C C C C C C C'),
  },
  {
    id: 'w3-jingle-bells', world: 3, difficulty: 3, bpm: 112, timeSig: [4, 4], credit: { en: 'J. L. Pierpont (1857)', es: 'J. L. Pierpont (1857)' }, staff: true,
    title: { en: 'Jingle Bells', es: 'Jingle Bells (Navidad, Navidad)' },
    objective: { en: 'Mix quarters, halves, wholes and eighths at a lively tempo.', es: 'Mezcla negras, blancas, redondas y corcheas a buen ritmo.' },
    intro: {
      en: ['Every rhythm you know, in one cheerful song. Repeated notes need a quick release and re-press.', 'Tip: if you tend to be early or late, the results screen will tell you.'],
      es: ['Todos los ritmos que conoces en una canción alegre. Las notas repetidas necesitan soltar y volver a pulsar rápido.', 'Consejo: si sueles adelantarte o atrasarte, la pantalla de resultados te lo dirá.'],
    },
    focus: [64, 67, 60],
    notes: parseSeq(JINGLE),
    accompaniment: oompah(JINGLE_CHORDS),
  },
  // ───────────────────────────── World 4 — black keys inside songs
  {
    id: 'w4-ode-in-d', world: 4, difficulty: 3, bpm: 100, timeSig: [4, 4], credit: BEETHOVEN, staff: true,
    title: { en: 'Ode to Joy in D', es: 'Himno a la alegría en Re' },
    objective: { en: 'Your first black key: F♯.', es: 'Tu primera tecla negra: Fa♯.' },
    intro: {
      en: ['Black keys are sharps (♯) and flats (♭). The black key right of F is F♯ ("F sharp") — key T, in the top row.', 'Start the same melody on F♯ and it needs that black key to sound right. Your ear will tell you if you miss it!'],
      es: ['Las teclas negras son sostenidos (♯) y bemoles (♭). La negra a la derecha de Fa es Fa♯ ("Fa sostenido"): tecla T, en la fila superior.', 'Empieza la misma melodía en Fa♯ y necesitará esa tecla negra para sonar bien. ¡Tu oído notará si fallas!'],
    },
    focus: [66, 62],
    notes: parseSeq('F#4 F#4 G4 A4 | A4 G4 F#4 E4 | D4 D4 E4 F#4 | F#4 E4 E4:2 | F#4 F#4 G4 A4 | A4 G4 F#4 E4 | D4 D4 E4 F#4 | E4 D4 D4:2'),
    accompaniment: oompah('D A D A D A D A,D'),
  },
  {
    id: 'w4-greensleeves', world: 4, difficulty: 3, bpm: 100, timeSig: [3, 4], credit: TRAD, staff: true,
    title: { en: 'Greensleeves', es: 'Greensleeves' },
    objective: { en: 'G♯ and F♯ in a minor-key melody.', es: 'Sol♯ y Fa♯ en una melodía menor.' },
    intro: {
      en: ['Greensleeves is in A minor — the sad-sounding cousin of C major. Its G♯ (key Y) pulls back up to A.', 'A semitone is the smallest step: from any key to its very next neighbour. G♯ → A is one semitone.'],
      es: ['Greensleeves está en La menor, el primo melancólico de Do mayor. Su Sol♯ (tecla Y) tira de vuelta hacia La.', 'Un semitono es el paso más pequeño: de una tecla a su vecina inmediata. Sol♯ → La es un semitono.'],
    },
    focus: [68, 66, 69],
    notes: parseSeq('R:2 A4 | C5:2 D5 | E5:1.5 F5:.5 E5 | D5:2 B4 | G4:1.5 A4:.5 B4 | C5:2 A4 | A4:1.5 G#4:.5 A4 | B4:2 G#4 | E4:2 A4 | C5:2 D5 | E5:1.5 F5:.5 E5 | D5:2 B4 | G4:1.5 A4:.5 B4 | C5:1.5 B4:.5 A4 | G#4:1.5 F#4:.5 G#4 | A4:3'),
    accompaniment: pads('R Am C G Em Am E E Am Am C G Em Am E Am', 3),
  },
  {
    id: 'w4-minuet-in-d', world: 4, difficulty: 4, bpm: 104, timeSig: [3, 4], credit: { en: 'C. Petzold (attr. J. S. Bach)', es: 'C. Petzold (atrib. J. S. Bach)' }, staff: true,
    title: { en: 'Minuet in G (in D)', es: 'Minueto en Sol (en Re)' },
    objective: { en: 'Two sharps — F♯ and C♯ — in flowing eighths.', es: 'Dos sostenidos, Fa♯ y Do♯, en corcheas fluidas.' },
    intro: {
      en: ['Bach\'s famous minuet, moved to D so it fits your keyboard. D major uses two black keys: F♯ (T) and C♯ (W, and O up high).', 'Notes on the staff with a ♯ in front are the black keys.'],
      es: ['El famoso minueto de Bach, transportado a Re para que quepa en tu teclado. Re mayor usa dos teclas negras: Fa♯ (T) y Do♯ (W, y O en el agudo).', 'Las notas del pentagrama con ♯ delante son las teclas negras.'],
    },
    focus: [66, 61, 73],
    notes: parseSeq('A4 D4:.5 E4:.5 F#4:.5 G4:.5 | A4 D4 D4 | B4 G4:.5 A4:.5 B4:.5 C#5:.5 | D5 D4 D4 | G4 A4:.5 G4:.5 F#4:.5 E4:.5 | F#4 G4:.5 F#4:.5 E4:.5 D4:.5 | C#4 D4:.5 E4:.5 F#4:.5 D4:.5 | E4:3 | A4 D4:.5 E4:.5 F#4:.5 G4:.5 | A4 D4 D4 | B4 G4:.5 A4:.5 B4:.5 C#5:.5 | D5 D4 D4 | G4 A4:.5 G4:.5 F#4:.5 E4:.5 | F#4 G4:.5 F#4:.5 E4:.5 D4:.5 | E4 F#4:.5 E4:.5 D4:.5 C#4:.5 | D4:3'),
    accompaniment: oompah('D D G D A D A A D D G D A D A D', 3),
  },
  {
    id: 'w4-fur-elise', world: 4, difficulty: 4, bpm: 80, timeSig: [3, 4], credit: BEETHOVEN, staff: true,
    title: { en: 'Für Elise (opening)', es: 'Para Elisa (inicio)' },
    objective: { en: 'Rock between E and D♯ — a semitone.', es: 'Mécete entre Mi y Re♯: un semitono.' },
    intro: {
      en: ['The world\'s most famous piano opening rocks between E and D♯ (keys ; and P) — two keys a semitone apart.', 'Then it sweeps down through an A minor chord. Take it slowly at first: try the "practice slower" button.'],
      es: ['El inicio de piano más famoso del mundo se mece entre Mi y Re♯ (teclas Ñ/; y P), separadas por un semitono.', 'Luego baja por un acorde de La menor. Al principio ve despacio: prueba el botón "practicar más lento".'],
    },
    focus: [76, 75, 69],
    notes: parseSeq('R:2 E5:.5 D#5:.5 | E5:.5 D#5:.5 E5:.5 B4:.5 D5:.5 C5:.5 | A4:1.5 C4:.5 E4:.5 A4:.5 | B4:1.5 E4:.5 G#4:.5 B4:.5 | C5:1.5 E4:.5 E5:.5 D#5:.5 | E5:.5 D#5:.5 E5:.5 B4:.5 D5:.5 C5:.5 | A4:1.5 C4:.5 E4:.5 A4:.5 | B4:1.5 E4:.5 C5:.5 B4:.5 | A4:3'),
    accompaniment: pads('R R Am E Am R Am E Am', 3),
  },
  // ───────────────────────────── World 5 — chords (you play harmony, the tune plays along)
  {
    id: 'w5-mary-thirds', world: 5, difficulty: 3, bpm: 84, timeSig: [4, 4], credit: TRAD, staff: true,
    title: { en: 'Mary Had a Little Lamb — Two at Once', es: 'Mary Had a Little Lamb — Dos a la vez' },
    objective: { en: 'Press two keys together: melody plus harmony.', es: 'Pulsa dos teclas juntas: melodía más armonía.' },
    intro: {
      en: ['Blocks side by side start together — press both keys at the same moment.', 'Each melody note gets a partner two white keys above it (a "third"). It\'s the song you know, just richer. (If a key combination won\'t register, that\'s keyboard "ghosting", not you.)'],
      es: ['Los bloques que van lado a lado empiezan juntos: pulsa ambas teclas a la vez.', 'Cada nota tiene una compañera dos teclas blancas más arriba (una "tercera"). Es la canción que conoces, más rica. (Si una combinación no se registra, es el "ghosting" del teclado, no tú.)'],
    },
    focus: [60, 64, 67],
    notes: parseSeq(MARY.replace(/E4/g, 'E4+G4').replace(/D4/g, 'D4+F4').replace(/C4/g, 'C4+E4').replace(/(^|\s)G4/g, '$1G4+B4')),
    accompaniment: oompah('C C G C C C G C'),
  },
  {
    id: 'w5-frere-chords', world: 5, difficulty: 3, bpm: 92, timeSig: [4, 4], credit: TRAD, staff: true,
    title: { en: 'Frère Jacques — C Major Chord', es: 'Martinillo — Acorde de Do mayor' },
    objective: { en: 'Play the C major chord while the melody sings.', es: 'Toca el acorde de Do mayor mientras suena la melodía.' },
    intro: {
      en: ['A chord is three or more notes played together. C major = C + E + G: start on C and skip a white key each time (keys A, D, G).', 'Frère Jacques needs only this one chord! You play the harmony; the melody plays along above you.'],
      es: ['Un acorde son tres o más notas a la vez. Do mayor = Do + Mi + Sol: empieza en Do y salta una tecla blanca cada vez (teclas A, D, G).', '¡Martinillo solo necesita este acorde! Tú tocas la armonía y la melodía suena encima.'],
    },
    focus: [60, 64, 67],
    notes: parseSeq(`${chordPart('C C C C')} | ${'C4+E4+G4 R '.repeat(4)}| ${chordPart('C C')}`),
    accompaniment: [...octaveUp(parseSeq(FRERE)), ...bassOnly(pads('C C C C C C C C'))],
  },
  {
    id: 'w5-twinkle-chords', world: 5, difficulty: 4, bpm: 88, timeSig: [4, 4], credit: TRAD, staff: true,
    title: { en: 'Twinkle Twinkle — F and G Chords', es: 'Estrellita — Acordes de Fa y Sol' },
    objective: { en: 'Move the chord shape between C, F and G.', es: 'Mueve la forma del acorde entre Do, Fa y Sol.' },
    intro: {
      en: ['The "skip a key" shape works anywhere. F major = F A C (keys F H K). G major = G B D (keys G J L).', 'Your hand keeps the same shape and just slides. These three chords — C, F and G — can accompany thousands of songs.'],
      es: ['La forma "salta una tecla" funciona en cualquier sitio. Fa mayor = Fa La Do (teclas F H K). Sol mayor = Sol Si Re (teclas G J L).', 'Tu mano mantiene la forma y solo se desliza. Estos tres acordes, Do, Fa y Sol, acompañan miles de canciones.'],
    },
    focus: [65, 69, 72, 67, 71, 74],
    notes: parseSeq(chordPart(TWINKLE_CHORDS)),
    accompaniment: [...octaveUp(parseSeq(TWINKLE)), ...bassOnly(pads(TWINKLE_CHORDS))],
  },
  {
    id: 'w5-jingle-chords', world: 5, difficulty: 4, bpm: 104, timeSig: [4, 4], credit: { en: 'J. L. Pierpont (1857)', es: 'J. L. Pierpont (1857)' }, staff: true,
    title: { en: 'Jingle Bells — I, IV, V', es: 'Jingle Bells — I, IV, V' },
    objective: { en: 'The most common chord progression in music.', es: 'La progresión de acordes más común de la música.' },
    intro: {
      en: ['C, F and G sit on the 1st, 4th and 5th notes of the C major scale, so musicians call them I, IV and V.', 'Going I → IV → V → I feels like leaving home and coming back. Play two chords per bar while Jingle Bells rings above you.'],
      es: ['Do, Fa y Sol están en la 1ª, 4ª y 5ª nota de la escala de Do mayor; por eso se llaman I, IV y V.', 'Ir de I → IV → V → I se siente como salir de casa y volver. Toca dos acordes por compás mientras Jingle Bells suena encima.'],
    },
    focus: [60, 65, 67],
    notes: parseSeq(chordPart(JINGLE_CHORDS.split(' ').map((c) => `${c},${c}`).join(' '))),
    accompaniment: [...octaveUp(parseSeq(JINGLE)), ...bassOnly(pads(JINGLE_CHORDS))],
  },
  // ───────────────────────────── World 6 — playing music
  {
    id: 'w6-yankee-doodle', world: 6, difficulty: 4, bpm: 116, timeSig: [4, 4], credit: TRAD, staff: true,
    title: { en: 'Yankee Doodle', es: 'Yankee Doodle' },
    objective: { en: 'Use the whole lower octave at speed.', es: 'Usa toda la octava grave con velocidad.' },
    intro: {
      en: ['The chorus dives well below middle C, so for this song your home row slides a whole range lower.', 'Watch the labels, not your hands — the letters always tell you what to press.'],
      es: ['El estribillo baja mucho del Do central, así que en esta canción tu fila central se desplaza hacia abajo.', 'Mira las etiquetas, no tus manos: las letras siempre te dicen qué pulsar.'],
    },
    focus: [59, 57, 55, 53, 52],
    notes: parseSeq('C4 C4 D4 E4 | C4 E4 D4 G3 | C4 C4 D4 E4 | C4:2 B3:2 | C4 C4 D4 E4 | F4 E4 D4 C4 | B3 G3 A3 B3 | C4:2 C4:2 | A3 B3 A3 G3 | A3 B3 C4:2 | G3 A3 G3 F3 | E3:2 G3:2 | A3 B3 A3 G3 | A3 B3 C4 A3 | G3 C4 B3 D4 | C4:2 C4:2'),
    accompaniment: oompah('C C,G C C,G C F,C G C F F,C G7 C F F,C C,G C'),
  },
  {
    id: 'w6-oh-susanna', world: 6, difficulty: 4, bpm: 112, timeSig: [4, 4], credit: { en: 'Stephen Foster (1848)', es: 'Stephen Foster (1848)' }, staff: true,
    title: { en: 'Oh! Susanna', es: 'Oh! Susanna' },
    objective: { en: 'Pickups and dotted rhythms with a bouncy feel.', es: 'Anacrusas y ritmos con puntillo, con rebote.' },
    intro: {
      en: ['A dotted note lasts one and a half times as long — "long-short" rhythms give this song its bounce.', 'It starts with two quick pickup notes before the first beat.'],
      es: ['Una nota con puntillo dura una vez y media: los ritmos "largo-corto" le dan el rebote a esta canción.', 'Empieza con dos notas rápidas de anacrusa antes del primer pulso.'],
    },
    focus: [60, 62, 64, 67, 69],
    notes: parseSeq('R:3 C4:.5 D4:.5 | E4 G4 G4:1.5 A4:.5 | G4 E4 C4:1.5 D4:.5 | E4 E4 D4 C4 | D4:3 C4:.5 D4:.5 | E4 G4 G4:1.5 A4:.5 | G4 E4 C4:1.5 D4:.5 | E4 E4 D4 D4 | C4:4 | F4:2 F4:2 | A4 A4:2 A4 | G4 G4 E4 C4 | D4:3 C4:.5 D4:.5 | E4 G4 G4:1.5 A4:.5 | G4 E4 C4:1.5 D4:.5 | E4 E4 D4 D4 | C4:4'),
    accompaniment: oompah('R C C,G C G C C,G C,G C F F C G C C,G C,G C'),
  },
  {
    id: 'w6-brahms-lullaby', world: 6, difficulty: 4, bpm: 84, timeSig: [3, 4], credit: { en: 'Johannes Brahms', es: 'Johannes Brahms' }, staff: true,
    title: { en: 'Brahms\' Lullaby', es: 'Canción de cuna de Brahms' },
    objective: { en: 'Play gently and smoothly across an octave.', es: 'Toca suave y ligado a lo largo de una octava.' },
    intro: {
      en: ['A lullaby rocks in 3/4. Let each note flow into the next — release one key just as you press the next.', 'Watch for the leap up to high C (key K) — it\'s the top of every phrase.'],
      es: ['Una canción de cuna se mece en 3/4. Deja que cada nota fluya a la siguiente: suelta una tecla justo al pulsar la otra.', 'Atento al salto al Do agudo (tecla K): es la cima de cada frase.'],
    },
    focus: [72, 71, 69],
    notes: parseSeq('R:2 E4:.5 E4:.5 | G4:2 E4:.5 E4:.5 | G4:2 E4:.5 G4:.5 | C5 B4:1.5 A4:.5 | A4 G4 D4:.5 E4:.5 | F4 D4 D4:.5 E4:.5 | F4:2 D4:.5 F4:.5 | B4:.5 A4:.5 G4 B4 | C5:2 C4:.5 C4:.5 | C5:2 A4:.5 F4:.5 | G4:2 E4:.5 C4:.5 | F4 G4 A4 | G4:2 C4:.5 C4:.5 | C5:2 A4:.5 F4:.5 | G4:2 E4:.5 C4:.5 | F4 E4:.5 D4:.5 C4 | C4:3'),
    accompaniment: pads('R C C C G7 G7 G7 G7 C F C F C F C G7 C', 3),
  },
  {
    id: 'w6-entertainer', world: 6, difficulty: 5, bpm: 88, timeSig: [4, 4], credit: { en: 'Scott Joplin (1902)', es: 'Scott Joplin (1902)' }, staff: true,
    title: { en: 'The Entertainer', es: 'The Entertainer' },
    objective: { en: 'Ragtime: semitones, syncopation and big leaps.', es: 'Ragtime: semitonos, síncopas y grandes saltos.' },
    intro: {
      en: ['Scott Joplin\'s ragtime classic climbs by semitones (D, D♯, E) and then leaps up an octave to high C.', 'Syncopation means accents land between the beats — feel the bounce. This is your graduation piece!'],
      es: ['El clásico ragtime de Scott Joplin sube por semitonos (Re, Re♯, Mi) y salta una octava hasta el Do agudo.', 'Síncopa significa acentos entre los pulsos: siente el rebote. ¡Esta es tu pieza de graduación!'],
    },
    focus: [62, 63, 64, 72],
    notes: parseSeq('R:3 D4:.5 D#4:.5 | E4:.5 C5 E4:.5 C5 E4:.5 C5:.5 | C5:2.5 C5:.5 D5:.5 D#5:.5 | E5:.5 C5:.5 D5:.5 E5 B4:.5 D5 | C5:3 D4:.5 D#4:.5 | E4:.5 C5 E4:.5 C5 E4:.5 C5:.5 | C5:2.5 A4:.5 G4:.5 F#4:.5 | A4:.5 C5:.5 E5 D5:.5 C5:.5 A4:.5 D5:.5 | C5:4'),
    accompaniment: oompah('R C C G7 C C C,D G7 C'),
  },
];

export const LESSON_IDS = LESSONS.map((l) => l.id);
export const lessonById = (id: string): Lesson | undefined => LESSONS.find((l) => l.id === id);
