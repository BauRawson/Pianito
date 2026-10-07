// Free Play: the full mapped piano with rising note trails, sustain pedal and touch.
import type { App, Screen } from './app';
import { h, svgIcon, ICONS } from './dom';
import { t } from '../i18n';
import { Renderer } from '../game/renderer';
import { KEYBOARD_RANGE } from '../core/keymap';
import { noteName } from '../core/music';
import type { Voice } from '../audio/engine';
import { showKeysHelp } from './dialogs';

export function freePlayScreen(app: App): Screen {
  const canvas = h('canvas', { class: 'game-canvas', 'aria-label': t('modeFreeTitle') });
  const noteDisplay = h('div', { class: 'free-note', 'aria-live': 'polite' }, '');
  const sustainEl = h('span', { class: 'pill' }, t('sustain'));
  const el = h('main', { class: 'game free' },
    h('div', { class: 'hud' },
      h('button', { class: 'icon-btn light', 'aria-label': t('back'), onclick: () => app.go({ name: 'home' }) }, svgIcon(ICONS.back)),
      h('div', { class: 'hud-title' }, h('strong', null, t('modeFreeTitle')), h('span', null, app.touchOnly ? t('touchHint') : t('freeHint'))),
      h('div', { class: 'hud-stats' },
        sustainEl,
        h('button', { class: 'btn ghost small light', onclick: () => showKeysHelp() }, svgIcon(ICONS.keyboard), t('keysHelp')),
      ),
    ),
    h('div', { class: 'stage' }, canvas, h('div', { class: 'rotate-hint' }, h('span', { class: 'rotate-icon', 'aria-hidden': 'true' }, '📱'), t('rotate')), noteDisplay),
  );

  const renderer = new Renderer(canvas);
  renderer.trailsEnabled = true;
  renderer.reducedMotion = app.settings.reducedMotion();
  renderer.mobile = app.touchOnly;
  const voices = new Map<number, Voice>();
  const sustained: Voice[] = [];
  let sustain = false;
  let raf = 0;

  const unsub = app.input.subscribe((e) => {
    const now = performance.now();
    if (e.on) {
      voices.get(e.pitch)?.stop();
      voices.set(e.pitch, app.audio.noteOn(e.pitch, { velocity: 0.85 }));
      renderer.trailOn(e.pitch, now);
      renderer.hit(e.pitch, 'perfect', now);
      noteDisplay.textContent = noteName(e.pitch, app.settings.naming());
      noteDisplay.classList.remove('pop');
      void noteDisplay.offsetWidth;
      noteDisplay.classList.add('pop');
    } else {
      const v = voices.get(e.pitch);
      voices.delete(e.pitch);
      if (v) { if (sustain) sustained.push(v); else v.stop(); }
      renderer.trailOff(e.pitch, now);
    }
  });

  const setSustain = (on: boolean) => {
    sustain = on;
    sustainEl.classList.toggle('on', on);
    if (!on) { sustained.splice(0).forEach((v) => v.stop()); }
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) setSustain(true); }
    if (e.key === 'Escape') app.go({ name: 'home' });
  };
  const onKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space') setSustain(false); };

  const frame = () => {
    raf = requestAnimationFrame(frame);
    const s = app.settings.get();
    renderer.draw({
      time: 0, lookahead: 2, notes: null, states: null,
      lo: KEYBOARD_RANGE.lo, hi: KEYBOARD_RANGE.hi,
      pressed: app.input.pressed(), beatDur: 0, beatsPerBar: 4, beatStart: 0,
      labels: app.touchOnly ? 'notes' : s.labels, naming: app.settings.naming(), staff: false,
    }, performance.now());
  };

  const active = new Set<number>();
  const pitchAt = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return renderer.keyAt(e.clientX - r.left, e.clientY - r.top);
  };
  canvas.addEventListener('pointerdown', (e) => {
    const p = pitchAt(e);
    if (p === null) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    active.add(e.pointerId);
    app.input.touch(String(e.pointerId), p, e.timeStamp);
  });
  canvas.addEventListener('pointermove', (e) => { if (active.has(e.pointerId)) app.input.touch(String(e.pointerId), pitchAt(e), e.timeStamp); });
  const up = (e: PointerEvent) => { if (active.delete(e.pointerId)) app.input.touch(String(e.pointerId), null, e.timeStamp); };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);

  const onResize = () => renderer.resize();
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('resize', onResize);
  requestAnimationFrame(() => { renderer.resize(); frame(); });

  return {
    el,
    ownsSound: true,
    immersive: true,
    destroy() {
      cancelAnimationFrame(raf);
      unsub();
      setSustain(false);
      voices.forEach((v) => v.stop());
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
    },
  };
}
