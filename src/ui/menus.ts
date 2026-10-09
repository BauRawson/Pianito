// Menu screens: landing page, Learn map, lesson intro, Arcade list.
import type { App, Route, Screen } from './app';
import { h, svgIcon, ICONS, stars, fmtScore, pct } from './dom';
import { t, tl, tla } from '../i18n';
import { LESSONS, LESSON_IDS, WORLDS, lessonById } from '../data/lessons';
import { ARCADE } from '../data/arcade';
import type { Song } from '../data/types';
import { gradeFor } from '../core/progress';
import { miniPiano } from './piano';
import { showKeysHelp, showPianoGuide, showTutorial } from './dialogs';
import { rangeFor } from '../game/layout';
import { labelForMidi, fitKeyboard, setKeyMap, DEFAULT_BASE, keyLabel, HOME_ROW } from '../core/keymap';
import { noteColor, noteName } from '../core/music';

const PRACTICE_RATE = 0.75;

const DIFF_KEYS = ['diff1', 'diff2', 'diff3', 'diff4', 'diff5'] as const;
/** Coloured "Easy … Expert" pill with five pips. */
function difficultyBadge(n: number): HTMLElement {
  const d = Math.min(5, Math.max(1, Math.round(n)));
  return h('span', { class: `diff-badge d${d}`, title: `${t('difficulty')}: ${d}/5` },
    h('span', { class: 'pips', 'aria-hidden': 'true' }, [1, 2, 3, 4, 5].map((i) => h('i', { class: i <= d ? 'on' : '' }))),
    t(DIFF_KEYS[d - 1]));
}

function startPlaying(app: App): void {
  const next = app.progress.nextLesson(LESSON_IDS) ?? LESSON_IDS[0];
  const go = () => app.go({ name: 'lesson', id: next });
  if (!app.progress.tutorialSeen) showTutorial(app, go);
  else go();
}

function touchBanner(app: App): HTMLElement | null {
  return app.touchOnly ? h('div', { class: 'banner info' }, t('noKeyboard')) : null;
}

// ─────────────────────────────────────────────── Landing
export function homeScreen(app: App): Screen {
  const next = app.progress.nextLesson(LESSON_IDS);
  const nextLesson = next ? lessonById(next) : undefined;
  const demoNotes = [
    { k: 'A', c: noteColor(60), col: 0, d: 0 },
    { k: 'D', c: noteColor(64), col: 2, d: 0.9 },
    { k: 'G', c: noteColor(67), col: 4, d: 1.8 },
    { k: 'S', c: noteColor(62), col: 1, d: 2.7 },
    { k: 'J', c: noteColor(71), col: 6, d: 3.4 },
    { k: 'F', c: noteColor(65), col: 3, d: 4.1 },
  ];
  const demo = h('div', { class: 'hero-demo', 'aria-hidden': 'true' },
    h('div', { class: 'demo-lanes' }, demoNotes.map((n) =>
      h('div', { class: 'demo-block', style: `--col:${n.col};--d:${n.d}s;--c:${n.c}` }, h('b', null, n.k)))),
    h('div', { class: 'demo-judge' }),
    h('div', { class: 'demo-keys' }, ['A', 'S', 'D', 'F', 'G', 'H', 'J'].map((k, i) =>
      h('div', { class: 'demo-key', style: `--c:${noteColor([60, 62, 64, 65, 67, 69, 71][i])}` }, h('span', null, k)))),
  );

  const el = h('main', { class: 'home' },
    touchBanner(app),
    h('section', { class: 'hero' },
      h('div', { class: 'hero-text' },
        h('h1', null, h('span', { class: 'wordmark' }, 'PIANITO'), h('span', { class: 'tagline' }, t('tagline'))),
        h('p', { class: 'lead' }, t('heroSub')),
        h('div', { class: 'cta' },
          h('button', { class: 'btn primary xl', onclick: () => startPlaying(app) }, svgIcon(ICONS.play), t('playNow')),
          h('button', { class: 'btn secondary xl', onclick: () => app.go({ name: 'free' }) }, t('freePlay')),
        ),
        h('p', { class: 'continue' }, nextLesson ? t('continueLesson', { title: tl(nextLesson.title) }) : t('allDone')),
      ),
      demo,
    ),
    h('section', { class: 'modes' },
      modeCard('learn', t('modeLearnTitle'), t('modeLearnText'), () => app.go({ name: 'learn' })),
      modeCard('arcade', t('modeArcadeTitle'), t('modeArcadeText'), () => app.go({ name: 'arcade' })),
      modeCard('free', t('modeFreeTitle'), t('modeFreeText'), () => app.go({ name: 'free' })),
    ),
    h('section', { class: 'how' },
      h('h2', null, t('howTitle')),
      h('ol', { class: 'steps' },
        h('li', null, h('span', { class: 'step-n' }, '1'), t('how1')),
        h('li', null, h('span', { class: 'step-n' }, '2'), t('how2')),
        h('li', null, h('span', { class: 'step-n' }, '3'), t('how3')),
      ),
      h('div', { class: 'row center' },
        h('button', { class: 'btn ghost', onclick: () => showKeysHelp() }, svgIcon(ICONS.keyboard), t('keysHelp')),
        h('button', { class: 'btn ghost', onclick: () => showPianoGuide(app) }, t('pianoGuide')),
      ),
    ),
    h('section', { class: 'honest-card' },
      h('h3', null, t('honestTitle')),
      h('p', null, t('honestText')),
      h('p', { class: 'free' }, t('freeForever')),
    ),
    h('footer', { class: 'footer' }, t('footer')),
  );
  return { el };
}

function modeCard(kind: string, title: string, text: string, onclick: () => void): HTMLElement {
  return h('button', { class: `mode-card ${kind}`, onclick },
    h('span', { class: 'mode-art', 'aria-hidden': 'true' }),
    h('strong', null, title),
    h('span', null, text),
  );
}

// ─────────────────────────────────────────────── Learn map
export function learnScreen(app: App): Screen {
  const next = app.progress.nextLesson(LESSON_IDS);
  const total = app.progress.totalStars(LESSON_IDS);
  const el = h('main', { class: 'learn page' },
    touchBanner(app),
    h('div', { class: 'page-head' },
      h('div', null,
        h('h1', null, t('learn')),
        h('p', { class: 'muted' }, t('stars', { n: total, total: LESSON_IDS.length * 3 }), ' · ', `${app.progress.completedCount(LESSON_IDS)}/${LESSON_IDS.length} ${t('completed').toLowerCase()}`),
      ),
      h('div', { class: 'row' },
        h('button', { class: 'btn ghost', onclick: () => showPianoGuide(app) }, t('pianoGuide')),
        h('button', { class: 'btn ghost', onclick: () => showKeysHelp() }, svgIcon(ICONS.keyboard), t('keysHelp')),
      ),
    ),
    WORLDS.map((w) => {
      const lessons = LESSONS.filter((l) => l.world === w.id);
      return h('section', { class: `world w${w.id}` },
        h('div', { class: 'world-head' },
          h('span', { class: 'world-n' }, t('world', { n: w.id })),
          h('h2', null, tl(w.title)),
          h('p', null, tl(w.blurb)),
        ),
        h('div', { class: 'lesson-grid' }, lessons.map((l) => {
          const idx = LESSON_IDS.indexOf(l.id) + 1;
          const done = app.progress.isCompleted(l.id);
          return h('button', { class: `lesson-card${done ? ' done' : ''}${l.id === next ? ' next' : ''}`, onclick: () => app.go({ name: 'lesson', id: l.id }) },
            h('span', { class: 'lesson-n' }, done ? svgIcon(ICONS.check, 16) : String(idx)),
            h('strong', null, tl(l.title)),
            h('span', { class: 'obj' }, tl(l.objective)),
            h('span', { class: 'card-foot' }, stars(app.progress.stars(l.id)), difficultyBadge(l.difficulty)),
          );
        })),
      );
    }),
  );
  return { el };
}

// ─────────────────────────────────────────────── Lesson intro
export function lessonScreen(app: App, route: Route): Screen {
  const lesson = route.name === 'lesson' ? lessonById(route.id) : undefined;
  if (!lesson) return learnScreen(app);
  const world = WORLDS.find((w) => w.id === lesson.world)!;
  const idx = LESSON_IDS.indexOf(lesson.id);
  const naming = app.settings.naming();
  const keys = fitKeyboard(lesson.notes.map((n) => n.pitch));
  if (keys) setKeyMap(keys);
  const { lo, hi } = rangeFor(lesson.notes.map((n) => n.pitch));
  const found = new Set<number>();
  const piano = miniPiano(lo, hi, { naming, highlight: lesson.focus, onPress: (m, on) => app.input.touch('intro', on ? m : null, performance.now()) });
  const status = h('p', { class: 'try-status' }, t('tryIt'));
  const chips = h('div', { class: 'focus-chips' }, lesson.focus.map((m) =>
    h('span', { class: 'chip', 'data-m': m, style: `--c:${noteColor(m)}` }, h('b', null, labelForMidi(m) ?? '·'), ' ', noteName(m, naming))));
  const unsub = app.input.subscribe((e) => {
    piano.setPressed(app.input.pressed());
    if (e.on && lesson.focus.includes(e.pitch) && !found.has(e.pitch)) {
      found.add(e.pitch);
      piano.mark(e.pitch, 'found', true);
      chips.querySelector(`[data-m="${e.pitch}"]`)?.classList.add('found');
      if (found.size === lesson.focus.length) { status.textContent = t('tryDone'); status.classList.add('ok'); }
    }
  });
  const start = () => app.go({ name: 'play', id: lesson.id, mode: 'lesson' });
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter' && !(e.target as HTMLElement).closest?.('button')) start(); };
  window.addEventListener('keydown', onKey);
  const rec = app.progress.get(lesson.id);

  const el = h('main', { class: `lesson-intro page w${lesson.world}` },
    h('button', { class: 'btn ghost back', onclick: () => app.go({ name: 'learn' }) }, svgIcon(ICONS.back), t('learn')),
    h('div', { class: 'intro-card' },
      h('div', { class: 'intro-meta' },
        h('span', { class: 'world-n' }, `${t('world', { n: world.id })} · ${tl(world.title)}`),
        h('span', { class: 'row' }, difficultyBadge(lesson.difficulty), h('span', { class: 'muted' }, t('lessonN', { n: idx + 1 }))),
      ),
      h('h1', null, tl(lesson.title)),
      h('p', { class: 'objective' }, tl(lesson.objective)),
      h('div', { class: 'intro-text' }, tla(lesson.intro).map((p) => h('p', null, p))),
      keys && keys.base !== DEFAULT_BASE ? h('p', { class: 'shift-banner' }, t('keysShiftedLong', { key: keyLabel(HOME_ROW[0]), note: noteName(keys.base, naming), c: labelForMidi(60) ?? '?' })) : null,
      chips,
      piano.el,
      status,
      h('div', { class: 'row spread' },
        h('div', { class: 'muted small' },
          `${lesson.bpm} BPM · ${lesson.timeSig[0]}/${lesson.timeSig[1]} · ${tl(lesson.credit)}`,
          rec ? h('span', null, ' · ', t('best'), ': ', fmtScore(rec.bestScore), ' ', stars(rec.stars)) : null,
        ),
        h('div', { class: 'row' },
          h('button', { class: 'btn ghost', title: `${Math.round(lesson.bpm * PRACTICE_RATE)} BPM`, onclick: () => app.go({ name: 'play', id: lesson.id, mode: 'lesson', rate: PRACTICE_RATE }) }, t('practiceSlower')),
          h('button', { class: 'btn primary lg', onclick: start }, svgIcon(ICONS.play), t('startLesson')),
        ),
      ),
    ),
  );
  return { el, destroy: () => { unsub(); window.removeEventListener('keydown', onKey); } };
}

// ─────────────────────────────────────────────── Arcade
let hardMode = false;

export function arcadeScreen(app: App): Screen {
  const hardToggle = h('label', { class: 'toggle' },
    h('input', { type: 'checkbox', checked: hardMode || undefined, onchange: (e: Event) => { hardMode = (e.target as HTMLInputElement).checked; app.refresh(); } }),
    h('span', null, t('hardMode')),
  );
  const card = (s: Song) => {
      const key = hardMode ? `${s.id}:hard` : s.id;
      const rec = app.progress.get(key);
      return h('button', { class: 'song-card', onclick: () => app.go({ name: 'play', id: s.id, mode: 'arcade', hard: hardMode }) },
        h('div', { class: 'song-top' },
          difficultyBadge(s.difficulty),
          h('span', { class: 'bpm' }, `${Math.round(s.bpm * (hardMode ? 1.25 : 1))} BPM`),
        ),
        h('strong', null, tl(s.title)),
        h('span', { class: 'credit' }, tl(s.credit)),
        h('span', { class: 'obj' }, tl(s.objective)),
        h('div', { class: 'song-best' }, rec
          ? [h('span', { class: `grade g${gradeFor(rec.bestAccuracy)}` }, gradeFor(rec.bestAccuracy)), h('span', null, fmtScore(rec.bestScore)), h('span', { class: 'muted' }, pct(rec.bestAccuracy)), stars(rec.stars)]
          : h('span', { class: 'muted' }, t('noRecord'))),
      );
  };
  const el = h('main', { class: 'arcade page' },
    touchBanner(app),
    h('div', { class: 'page-head' },
      h('div', null, h('h1', null, t('arcade')), h('p', { class: 'muted' }, t('modeArcadeText'))),
      hardToggle,
    ),
    h('div', { class: 'song-grid' }, ARCADE.map((s) => card(s))),
  );
  return { el };
}
