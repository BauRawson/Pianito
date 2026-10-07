// Gameplay screen: HUD, canvas, touch input, pause and results overlays.
import type { App, Route, Screen } from './app';
import { h, svgIcon, ICONS, stars, fmtScore, pct } from './dom';
import { t, tl } from '../i18n';
import { lessonById, LESSON_IDS } from '../data/lessons';
import { arcadeById } from '../data/arcade';
import type { Lesson, Song } from '../data/types';
import { GameSession, type SessionResult } from '../game/session';
import { gradeFor, isPassing } from '../core/progress';
import { showKeysHelp } from './dialogs';

export function gameScreen(app: App, route: Route): Screen {
  if (route.name !== 'play') throw new Error('bad route');
  const lesson: Lesson | undefined = route.mode === 'lesson' ? lessonById(route.id) : undefined;
  const song: Song | undefined = lesson ?? arcadeById(route.id);
  if (!song) { queueMicrotask(() => app.go({ name: 'home' })); return { el: h('main') }; }
  const rate = route.rate ?? (route.mode === 'arcade' && route.hard ? 1.25 : 1);
  const recordKey = route.mode === 'arcade' && route.hard ? `${song.id}:hard` : song.id;
  const s = app.settings.get();
  const staff = !app.touchOnly && (s.sheetMusic === 'on' || (s.sheetMusic === 'auto' && !!lesson?.staff));

  const scoreEl = h('span', { class: 'hud-val' }, '0');
  const comboEl = h('span', { class: 'hud-val' }, '0');
  const accEl = h('span', { class: 'hud-val' }, '100%');
  const progEl = h('div', { class: 'hud-progress-fill' });
  const canvas = h('canvas', { class: 'game-canvas', 'aria-label': tl(song.title) });
  const overlay = h('div', { class: 'overlay hidden' });
  const pauseBtn = h('button', { class: 'icon-btn light', 'aria-label': t('paused'), title: `${t('paused')} (Esc)`, onclick: () => togglePause() }, svgIcon(ICONS.pause));

  const el = h('main', { class: 'game' },
    h('div', { class: 'hud' },
      pauseBtn,
      h('div', { class: 'hud-title' }, h('strong', null, tl(song.title)), h('span', null, lesson ? `${tl(lesson.objective)} · ${Math.round(song.bpm * rate)} BPM` : `${Math.round(song.bpm * rate)} BPM`)),
      h('div', { class: 'hud-stats' },
        h('div', { class: 'hud-stat' }, h('span', { class: 'hud-label' }, t('score')), scoreEl),
        h('div', { class: 'hud-stat' }, h('span', { class: 'hud-label' }, t('combo')), comboEl),
        h('div', { class: 'hud-stat' }, h('span', { class: 'hud-label' }, t('accuracy')), accEl),
      ),
      h('div', { class: 'hud-progress' }, progEl),
    ),
    h('div', { class: 'stage' }, canvas, h('div', { class: 'rotate-hint' }, h('span', { class: 'rotate-icon', 'aria-hidden': 'true' }, '📱'), t('rotate')), app.touchOnly ? h('div', { class: 'touch-hint' }, t('touchHint')) : null, overlay),
  );

  let session: GameSession | null = null;
  let ended = false;
  let dead = false;

  const newSession = () => {
    session?.destroy();
    ended = false;
    hideOverlay();
    session = new GameSession(canvas, {
      song, rate, staff,
      metronome: app.settings.get().metronome || !!lesson?.metronome,
      focus: lesson?.focus,
      mobile: app.touchOnly,
    }, app.audio, app.input, app.settings, {
      hud: (hd) => {
        scoreEl.textContent = fmtScore(hd.score);
        comboEl.textContent = String(hd.combo);
        accEl.textContent = pct(hd.accuracy);
        progEl.style.width = `${hd.progress * 100}%`;
      },
      end: (r) => { ended = true; showResults(r); },
    });
    session.start();
  };

  const begin = async () => {
    const ok = await app.audio.ready();
    if (dead) return;
    if (!ok) {
      showOverlay(h('div', { class: 'panel' }, h('p', null, t('audioBlocked')), h('button', { class: 'btn primary lg', onclick: () => { void begin(); } }, svgIcon(ICONS.play), t('play'))));
      return;
    }
    newSession();
  };

  function showOverlay(content: HTMLElement): void {
    overlay.replaceChildren(content);
    overlay.classList.remove('hidden');
    (overlay.querySelector('.btn.primary') as HTMLElement | null)?.focus();
  }
  function hideOverlay(): void { overlay.classList.add('hidden'); overlay.replaceChildren(); }

  function togglePause(): void {
    if (!session || ended) return;
    if (session.paused) { hideOverlay(); session.resume(); return; }
    session.pause();
    const metro = h('input', { type: 'checkbox', checked: session.metronome || undefined, onchange: (e: Event) => { if (session) session.metronome = (e.target as HTMLInputElement).checked; } });
    const speed = h('input', { type: 'range', min: 1, max: 10, step: 1, value: app.settings.get().noteSpeed, oninput: (e: Event) => app.settings.set({ noteSpeed: Number((e.target as HTMLInputElement).value) }) });
    showOverlay(h('div', { class: 'panel' },
      h('h2', null, t('paused')),
      h('div', { class: 'stack' },
        h('button', { class: 'btn primary lg', onclick: () => togglePause() }, svgIcon(ICONS.play), t('resume')),
        h('button', { class: 'btn secondary', onclick: () => newSession() }, svgIcon(ICONS.retry), t('retry')),
        h('button', { class: 'btn ghost', onclick: () => showKeysHelp() }, svgIcon(ICONS.keyboard), t('keysHelp')),
        h('button', { class: 'btn ghost', onclick: () => quit() }, t('quit')),
      ),
      h('label', { class: 'toggle' }, metro, h('span', null, t('metronome'))),
      h('label', { class: 'slider' }, h('span', null, t('noteSpeed')), speed),
    ));
  }

  function quit(): void {
    app.go(lesson ? { name: 'learn' } : { name: 'arcade' });
  }

  function showResults(r: SessionResult): void {
    const outcome = app.progress.record(recordKey, { score: r.score, accuracy: r.accuracy, maxCombo: r.maxCombo });
    const grade = gradeFor(r.accuracy);
    const passed = isPassing(r.accuracy);
    const ms = Math.round(r.meanDelta * 1000);
    const tendency = Math.abs(ms) < 25 ? t('tendencyGood') : ms < 0 ? t('tendencyEarly', { ms: Math.abs(ms) }) : t('tendencyLate', { ms });
    const nextId = lesson ? LESSON_IDS[LESSON_IDS.indexOf(lesson.id) + 1] : undefined;
    const stat = (label: string, value: string | number, cls = '') => h('div', { class: `res-stat ${cls}` }, h('span', null, label), h('strong', null, String(value)));
    const primary = lesson && passed && nextId
      ? h('button', { class: 'btn primary lg', onclick: () => app.go({ name: 'lesson', id: nextId }) }, t('nextLesson'))
      : h('button', { class: 'btn primary lg', onclick: () => newSession() }, svgIcon(ICONS.retry), t('retry'));
    showOverlay(h('div', { class: 'panel results' },
      h('h2', null, t('results')),
      h('div', { class: 'res-top' },
        h('div', { class: `grade big g${grade}` }, grade),
        h('div', null,
          stars(outcome.stars),
          h('div', { class: 'res-score' }, fmtScore(r.score)),
          outcome.newBest ? h('span', { class: 'badge' }, t('newBest')) : null,
        ),
      ),
      lesson ? h('p', { class: passed ? 'pass' : 'fail' }, passed ? t('passMsg') : t('failMsg')) : null,
      h('div', { class: 'res-grid' },
        stat(t('accuracy'), pct(r.accuracy)),
        stat(t('maxCombo'), r.maxCombo),
        stat(t('perfect'), r.perfect, 'perfect'),
        stat(t('great'), r.great, 'great'),
        stat(t('good'), r.good, 'good'),
        stat(t('miss'), r.miss, 'miss'),
        r.holdsOk + r.holdsBroken > 0 ? stat(t('holds'), `${r.holdsOk}/${r.holdsOk + r.holdsBroken}`) : null,
        r.chords > 0 ? stat(t('chords'), r.chords) : null,
      ),
      r.perfect + r.great + r.good > 3 ? h('p', { class: 'tendency' }, tendency) : null,
      h('div', { class: 'row center wrap' },
        primary,
        lesson && passed && nextId ? h('button', { class: 'btn secondary', onclick: () => newSession() }, svgIcon(ICONS.retry), t('retry')) : null,
        h('button', { class: 'btn ghost', onclick: () => quit() }, t('backToList')),
      ),
    ));
  }

  // Keyboard shortcuts (note keys are handled by InputManager).
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); togglePause(); }
  };
  const onVisibility = () => { if (document.hidden && session && !session.paused && !ended) togglePause(); };
  const onResize = () => session?.resize();

  // Touch / mouse play on the on-screen piano.
  const activePointers = new Set<number>();
  const pointerPitch = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    return session?.keyAt(e.clientX - rect.left, e.clientY - rect.top) ?? null;
  };
  canvas.addEventListener('pointerdown', (e) => {
    const p = pointerPitch(e);
    if (p === null) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    activePointers.add(e.pointerId);
    app.input.touch(String(e.pointerId), p, e.timeStamp);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!activePointers.has(e.pointerId)) return;
    app.input.touch(String(e.pointerId), pointerPitch(e), e.timeStamp);
  });
  const up = (e: PointerEvent) => {
    if (!activePointers.delete(e.pointerId)) return;
    app.input.touch(String(e.pointerId), null, e.timeStamp);
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);

  window.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('resize', onResize);
  requestAnimationFrame(() => { void begin(); });

  return {
    el,
    ownsSound: true,
    immersive: true,
    destroy() {
      dead = true;
      session?.destroy();
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
    },
  };
}
