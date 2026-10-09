# 🎹 Pianito

**A free browser rhythm game that teaches real piano fundamentals.**
Coloured notes fall onto a piano keyboard; you play them on your computer keyboard as they reach the line. It's Synthesia meets Pump It Up, with a 25-lesson campaign that takes you from finding middle C to playing chords and real melodies.

- 100% client-side, no accounts, no backend, no API keys. Free forever.
- Progress, high scores and settings are saved in `localStorage`.
- English and Spanish UI (Spanish uses Do-Re-Mi note names by default).
- Piano sound is synthesized live with the Web Audio API, so there are no sample files to download or license.

## Modes

| Mode | What it is |
|---|---|
| **Learn** | 6 worlds, 25 lessons: after three warm-ups, every lesson is a real song you already know (Hot Cross Buns, Ode to Joy, Twinkle Twinkle, Amazing Grace, Greensleeves, Für Elise, Jingle Bells, The Entertainer…). Tempos start a little below natural speed and rise world by world, and every lesson has a "practice slower (75%)" option. Each lesson opens with a short, interactive explanation ("press the glowing keys") and then you play right away. Stars and completion are tracked, and every lesson stays open. |
| **Arcade** | 48 songs and exercises, including 30 simplified pop excerpts and accompaniments by Keane, Robbie Williams, Coldplay, Adele, Alicia Keys, Elton John and more, labelled Easy → Expert, with accompaniment, for scores, combos and S ranks. Hard mode plays them 25 % faster. |
| **Free Play** | A virtual piano with rising note trails and a sustain pedal (hold Space). |

## Controls

```
 W E   T Y U   O P          ← black keys (above the white keys they sit between)
A S D F G H J K L ; '       ← 11 white keys — by default C4 … F5 (A = middle C)
```

Every song is playable on just these two rows: when a song sits lower or higher, the window **slides** (e.g. A = G3) and the falling notes show which letters to press. Only Pachelbel's Canon, which is one note too wide, also uses one key of the bottom row. In Free Play, ← → shift the window by an octave.

The mapping uses physical key positions (`KeyboardEvent.code`), so it works the same on QWERTY, QWERTZ and AZERTY. Where the browser supports it, labels show your layout's printed characters. Other input options:

- **Esc**: pause/resume.
- **Touch or mouse**: tap the on-screen piano (works in Free Play and in lessons).
- **Web MIDI**: connect a digital piano under Settings → MIDI keyboard.

## Development

Requires Node 20 or newer.

```bash
npm install
npm run dev        # dev server at http://localhost:6173
npm test           # unit tests (Vitest)
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build locally
```

## Deploying to GitHub Pages

1. Push this repository to GitHub, with `main` as the default branch.
2. In the repository, go to **Settings → Pages → Build and deployment** and set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow by hand). `.github/workflows/deploy.yml` installs dependencies, runs the tests, builds, and publishes `dist/`.

The site is served at `https://<user>.github.io/<repo>/`. Vite is configured with a **relative base** (`./`), so the same build works from any subdirectory or from a domain root without changes. If you'd rather use absolute URLs, build with `VITE_BASE=/your-repo/ npm run build`.

## Architecture

```
src/
  core/            pure, DOM-free, unit-tested logic
    music.ts       pitch parsing, names (letters/solfège), colours, staff positions
    keymap.ts      computer-key ↔ MIDI mapping
    chart.ts       song notation parser; beats → seconds; chord grouping; hold detection
    judge.ts       deterministic timing judge: Perfect/Great/Good/Miss, holds, chords, combo, score
    progress.ts    stars, grades, completion, persistence
    settings.ts    preferences store
  audio/engine.ts  Web Audio synth piano, metronome, accompaniment bus, and the master clock
  input/input.ts   keyboard + touch + Web MIDI → one NoteEvent stream
  game/
    layout.ts      piano key geometry (the keys are the lanes)
    renderer.ts    Canvas highway, falling notes, piano, staff strip, effects
    session.ts     one play-through: timeline, scheduler, judge wiring, render loop
  data/            lessons (25), arcade songs (48), accompaniment helpers
  ui/              screens (home, learn, lesson intro, game, arcade, free play, settings), dialogs
  i18n.ts          English / Spanish strings
  config.ts        optional ad slot (disabled by default)
tests/             timing, scoring, chords, long notes, progression, content validation
```

### Timing and sync

- The **AudioContext clock is the single source of truth**. `AudioEngine.heardAt(t)` maps any `performance.now()`-style timestamp (frames, `KeyboardEvent.timeStamp`, MIDI timestamps) to the time of the audio *currently coming out of the speakers*, using `getOutputTimestamp()`, with `currentTime − outputLatency` as a fallback. The mapping is re-synced continuously, so long songs don't drift.
- Song time is `heardTime − origin`. Frames only sample it, so frame drops never shift the timeline.
- Accompaniment and metronome clicks are scheduled about 200 ms ahead on a 25 ms timer, using sample-accurate Web Audio start times.
- Presses are judged by the timestamp of the key event, not by when the frame ran, minus the user's calibrated input offset. The offset can be set in Settings → Timing calibration by tapping along to 16 clicks.
- Judgement windows are ±50 ms (Perfect), ±100 ms (Great) and ±150 ms (Good). Long notes (2 or more beats) must be held to their end cap; letting go early gives partial credit and breaks the combo.

### Song format

Songs are plain data. The compact notation is parsed into `{ pitch, beat, dur }` notes:

```ts
notes: parseSeq('C4 D4 E4:2 | R C4+E4+G4:4'),   // quarter, quarter, half, rest, C-major chord (whole)
accompaniment: oompah('C G C', 4),              // generated backing
```

Each song has a title, BPM, time signature, difficulty, an educational objective, credits, its notes and optional accompaniment. Lessons also have intro text, focus keys, and staff/metronome defaults.

`notes` is always the part the player performs and is scored on. An optional `vocalMelody: parseSeq('…')` plays automatically using a wordless synthesized "ah" voice. It shares the Accompaniment volume control and follows tempo changes and pause/resume. It contains no lyrics or artist recordings.

### Content and licensing

The catalog includes original Pianito exercises, simplified arrangements of public-domain works (traditional tunes, Beethoven, Petzold, Pierpont), and short arrangements of copyrighted pop songs. Pop song credits identify the artists and songwriters; these compositions remain the property of their respective rights holders. There are no recordings or audio samples. Every sound is synthesized at runtime.

The pop arrangements are transposed to fit the computer keyboard. The player performs a simplified piano accompaniment or instrumental hook. Excerpts with a vocal guide play the wordless melody automatically; instrumental accompaniment excerpts have bass support instead. Keane uses quarter-note chord pulses (a reduction of the faster original pulse), Angels uses half-note chord pulses, The Scientist uses repeated quarter-note chords, and Adele uses eighth-note broken chords (a reduction of the faster original arpeggios). These are short practice reductions, not full piano transcriptions. Clocks retains its instrumental piano intro, with sustained bass/chord backing and no vocal guide. References for the first five additions:

- Keane, **Somewhere Only We Know** — verse and chorus, transposed from A to C ([note reference](https://noobnotes.net/somewhere-only-we-know-keane/)).
- Robbie Williams, **Angels** — opening verse and chorus excerpt in C ([note reference](https://noobnotes.net/angels-robbie-williams/)).
- Coldplay, **The Scientist** — verse, transposed from F to C ([note reference](https://www.kalimbatabs.net/kalimba-tabs-tutorials/the-scientist-2/)).
- Coldplay, **Clocks** — repeating piano riff, transposed from E-flat to G and slowed to 120 BPM ([note reference](https://pianoletternotes.blogspot.com/2017/11/clocks-by-coldplay.html)). The final held note is an added practice ending.
- Adele, **Someone Like You** — chorus excerpt, transposed from A to C ([note reference](https://noobnotes.net/someone-like-you-adele/)).

The Adele piano reduction follows the broken-chord approach described in [Pianote's piano tutorial](https://www.pianote.com/blog/someone-like-you-piano-tutorial/).

### More pop arrangements

The following 25 additions are short, simplified piano arrangements, usually 8–16 bars. Accompaniments retain the referenced harmony with reduced rhythms and voicings; they are not full transcriptions. Guitar or string parts are explicitly labelled as piano adaptations. Vocal guides are included for Fix You, Hello, Your Song, Let It Be, A Thousand Years, All of Me, Perfect, How to Save a Life, and Don't Look Back in Anger. Other entries are instrumental accompaniment practice, without a vocal track.

| Song / artist | Arrangement | Reference |
|---|---|---|
| Everybody's Changing — Keane | C; repeated chords with Cmaj7 changes | [Chord chart](https://ukutabs.com/k/keane/everybodys-changing/) |
| Feel — Robbie Williams | D minor; broken chords over the verse's D pedal, then chorus harmony | [Chord chart](https://www.bellandcomusic.com/feel.html) |
| She's the One — Robbie Williams / Karl Wallinger | Transposed to C; half-note chord reduction | [Piano accompaniment lesson](https://www.youtube.com/watch?v=BBQdA_PBkDM) |
| Fix You — Coldplay | Chorus in C; sustained chords, suspended resolution and vocal guide | [Pianote lesson](https://www.pianote.com/blog/how-to-play-fix-you-coldplay-piano/) |
| Yellow — Coldplay | Verse harmony in C; guitar chords adapted to piano | [Piano lesson](https://www.supersimplepiano.com/how-to-play/yellow-842721439354641468) |
| Paradise — Coldplay | Transposed to A minor; chord pulse reduction | [Chord chart](https://www.cifraclub.com/coldplay/paradise/) |
| Viva la Vida — Coldplay | Transposed to C; simplified syncopated string groove on piano | [Piano lesson](https://www.supersimplepiano.com/how-to-play/viva-la-vida-272536865603631784) |
| Trouble — Coldplay | G; broken-chord accompaniment reduction | [Piano accompaniment lesson](https://www.youtube.com/watch?v=wRDi_LDzkyQ) |
| Hello — Adele | Chorus excerpt in A minor; half-note chords and vocal guide | [Vocal pitches](https://noobnotes.net/hello-adele/) |
| Easy on Me — Adele | Transposed to C; simplified seventh/suspended chords and syncopation | [Pianote lesson](https://www.pianote.com/blog/easy-on-me/) |
| Your Song — Elton John | Verse excerpt in C; broken chords and vocal guide | [Piano lesson](https://www.pianowithnate.com/All-Songs/your-song), [vocal pitches](https://noobnotes.net/your-song-elton-john/) |
| Let It Be — The Beatles | Original C; verse chord pulse and vocal guide | [Pianote lesson](https://www.pianote.com/blog/how-to-play-let-it-be-piano/), [vocal pitches](https://noobnotes.net/let-it-be-the-beatles/) |
| A Thousand Miles — Vanessa Carlton | Chorus piano rhythm in C; three short F chords, three Am chords, then G | [Piano lesson](https://pianolessons.com/piano-lessons/1000-miles-vanessa-carlton.php) |
| A Thousand Years — Christina Perri | Verse in G; slow 6/8 broken chords and vocal guide | [Piano lesson](https://www.piano-play-it.com/a-thousand-years-christina-perri.html), [vocal pitches](https://noobnotes.net/a-thousand-years-christina-perri/) |
| All of Me — John Legend | Verse in E minor; repeated chord reduction and vocal guide | [Piano accompaniment lesson](https://www.play-by-ear.net/all-of-me-piano-chords/), [vocal pitches](https://noobnotes.net/all-of-me-john-legend/) |
| When I Was Your Man — Bruno Mars | C; chorus chord reduction, including the major-to-minor IV change | [Chord and note chart](https://www.chords-and-tabs.net/song/name/bruno-mars-when-i-was-your-man-5) |
| Perfect — Ed Sheeran | Verse in C; slow 12/8 broken-chord piano adaptation and vocal guide | [Piano lesson](https://www.supersimplepiano.com/how-to-play/perfect-698647457720472500), [vocal pitches](https://noobnotes.net/perfect-ed-sheeran/) |
| Someone You Loved — Lewis Capaldi | Transposed to C; alternating upper/lower chord tones over bass | [Piano accompaniment lesson](https://www.play-by-ear.net/someone-you-loved-piano-chords/) |
| If I Ain't Got You — Alicia Keys | Intro reduction in G; descending broken seventh chords, slow 6/8 | [Piano lesson](https://www.youtube.com/watch?v=Bm4P_9xvfSU) |
| Apologize — OneRepublic | Transposed to A minor; broken-chord accompaniment reduction | [Piano accompaniment lesson](https://www.youtube.com/watch?v=fj_ffb-qoQI) |
| How to Save a Life — The Fray | Verse excerpt in C; broken chords and vocal guide | [Piano lesson](https://www.onlinepianist.com/piano-songs/the-fray/how-to-save-a-life), [vocal pitches](https://noobnotes.net/how-to-save-a-life-the-fray/) |
| Chasing Cars — Snow Patrol | Transposed to C; picked guitar figure adapted to piano over moving bass | [Picking/chord reference](https://www.bellandcomusic.com/chasing-cars.html) |
| No Surprises — Radiohead | Instrumental hook in C; guitar figure adapted to piano | [Instrumental tab](https://www.gotabs.com/radiohead/no-surprises-tab) |
| What Was I Made For? — Billie Eilish | C; spacious chord accompaniment with split bars | [Chord chart](https://www.chordband.com/chords/billie-eilish-what-was-i-made-for) |
| Don't Look Back in Anger — Oasis | Verse in C; chord pulse and vocal guide | [Chord chart](https://chordna.com/song/oasis_don_t_look_back_in_anger), [vocal pitches](https://noobnotes.net/dont-look-back-in-anger-oasis/) |

In the 6/8 and 12/8 practice charts, BPM and notation durations count eighth-note units. Their slower practice tempos keep the compound feel while remaining playable. `pianoPart(progression, pattern, beatsPerBar)` supports these meters, and `bassLine(progression, beatsPerBar)` adds automatic bass without doubling the player's chords. Additional chord shapes include Cmaj7, Fmaj7, Am7, Em7, C7, Gsus4, Csus2, Fsus2, Dsus2, Gm, Bb and Eb.

## Advertising (disabled)

Pianito ships with **no ads and no ad scripts**. `src/config.ts` contains an optional slot that renders only on menu screens, never during gameplay or near the piano. It loads a script only if you set `enabled: true` and give a `scriptSrc`.

## An honest note

A computer keyboard is a good way to learn note names, how the piano is laid out, and rhythm. It doesn't replace a real piano: fingering, hand position and touch are best learned on real keys, ideally with a teacher. Pianito is a first step.
