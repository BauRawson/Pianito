// Settings screen, including tap-along timing calibration and optional MIDI.
import type { App, Screen } from './app';
import { h } from './dom';
import { t } from '../i18n';
import type { Settings } from '../core/settings';
import { showTutorial } from './dialogs';

export function settingsScreen(app: App): Screen {
  const st = app.settings;
  const s = st.get();
  const cleanups: (() => void)[] = [];

  const range = (key: keyof Settings, label: string, min: number, max: number, step: number, fmt: (v: number) => string) => {
    const out = h('output', null, fmt(s[key] as number));
    return h('label', { class: 'set-row' }, h('span', null, label),
      h('input', { type: 'range', min, max, step, value: s[key] as number, oninput: (e: Event) => {
        const v = Number((e.target as HTMLInputElement).value);
        out.textContent = fmt(v);
        st.set({ [key]: v } as Partial<Settings>);
      } }), out);
  };
  const select = <K extends keyof Settings>(key: K, label: string, options: [Settings[K], string][], rerender = false) =>
    h('label', { class: 'set-row' }, h('span', null, label),
      h('select', { onchange: (e: Event) => { st.set({ [key]: (e.target as HTMLSelectElement).value } as Partial<Settings>); if (rerender) app.refresh(); } },
        options.map(([v, l]) => h('option', { value: String(v), selected: s[key] === v || undefined }, l))));
  const check = (key: keyof Settings, label: string) =>
    h('label', { class: 'set-row' }, h('span', null, label),
      h('input', { type: 'checkbox', class: 'switch', checked: (s[key] as boolean) || undefined, onchange: (e: Event) => st.set({ [key]: (e.target as HTMLInputElement).checked } as Partial<Settings>) }));
  const vol = (v: number) => `${Math.round(v * 100)}%`;

  // ── Calibration: 16 clicks at 100 BPM; median of (press − click) after the first four.
  const offsetOut = h('output', null, `${s.inputOffsetMs} ms`);
  const offsetSlider = h('input', { type: 'range', min: -150, max: 150, step: 5, value: s.inputOffsetMs, oninput: (e: Event) => {
    const v = Number((e.target as HTMLInputElement).value);
    offsetOut.textContent = `${v} ms`;
    st.set({ inputOffsetMs: v });
  } });
  const calStatus = h('p', { class: 'muted small' }, t('calibrateHelp'));
  const calBtn = h('button', { class: 'btn secondary', onclick: () => void calibrate() }, t('calibrate'));
  let calibrating = false;
  async function calibrate(): Promise<void> {
    if (calibrating || !(await app.audio.ready())) return;
    calibrating = true;
    calBtn.setAttribute('disabled', '');
    calStatus.textContent = t('calibrating');
    const beat = 0.6;
    const count = 16;
    const start = app.audio.heardNow() + 0.8;
    for (let i = 0; i < count; i++) app.audio.click(app.audio.toCtxTime(start + i * beat), i % 4 === 0);
    const deltas: number[] = [];
    const onTap = (time: number) => {
      const heard = app.audio.heardAt(time);
      const i = Math.round((heard - start) / beat);
      if (i < 4 || i >= count) return;
      const d = heard - (start + i * beat);
      if (Math.abs(d) < beat * 0.4) deltas.push(d);
    };
    const unsub = app.input.subscribe((e) => { if (e.on) onTap(e.time); });
    const onPointer = (e: PointerEvent) => onTap(e.timeStamp);
    window.addEventListener('pointerdown', onPointer);
    const finish = () => {
      unsub();
      window.removeEventListener('pointerdown', onPointer);
      calibrating = false;
      calBtn.removeAttribute('disabled');
      if (deltas.length < 6) { calStatus.textContent = t('calibrateFail'); return; }
      deltas.sort((a, b) => a - b);
      const ms = Math.round((deltas[Math.floor(deltas.length / 2)] * 1000) / 5) * 5;
      const clamped = Math.max(-150, Math.min(150, ms));
      st.set({ inputOffsetMs: clamped });
      offsetSlider.value = String(clamped);
      offsetOut.textContent = `${clamped} ms`;
      calStatus.textContent = t('calibrated', { ms: clamped });
    };
    const timer = window.setTimeout(finish, (0.8 + count * beat + 0.4) * 1000);
    cleanups.push(() => { clearTimeout(timer); unsub(); window.removeEventListener('pointerdown', onPointer); });
  }

  const midiStatus = h('span', { class: 'muted small' }, app.input.midiInputCount() ? t('midiOk', { n: app.input.midiInputCount() }) : '');
  const midiBtn = h('button', { class: 'btn secondary', onclick: async () => {
    const r = await app.input.enableMidi();
    midiStatus.textContent = r === 'ok' ? t('midiOk', { n: app.input.midiInputCount() }) : r === 'unsupported' ? t('midiUnsupported') : t('midiDenied');
  } }, t('midiConnect'));

  const el = h('main', { class: 'settings page' },
    h('h1', null, t('settings')),
    h('section', { class: 'set-card' },
      h('h2', null, t('language')),
      select('lang', t('language'), [['en', 'English'], ['es', 'Español']], true),
    ),
    h('section', { class: 'set-card' },
      h('h2', null, t('audio')),
      check('muted', t('mute')),
      range('masterVolume', t('masterVolume'), 0, 1, 0.05, vol),
      range('musicVolume', t('musicVolume'), 0, 1, 0.05, vol),
      range('metronomeVolume', t('metronomeVolume'), 0, 1, 0.05, vol),
      check('metronome', t('metronome')),
    ),
    h('section', { class: 'set-card' },
      h('h2', null, t('gameplay')),
      range('noteSpeed', t('noteSpeed'), 1, 10, 1, (v) => String(v)),
      select('labels', t('labels'), [['both', t('labelsBoth')], ['keys', t('labelsKeys')], ['notes', t('labelsNotes')]]),
      select('naming', t('naming'), [['auto', t('namingAuto')], ['letter', t('namingLetter')], ['solfege', t('namingSolfege')]]),
      select('sheetMusic', t('sheetMusic'), [['auto', t('auto')], ['on', t('on')], ['off', t('off')]]),
      select('reducedMotion', t('reducedMotion'), [['auto', t('auto')], ['on', t('on')], ['off', t('off')]]),
    ),
    h('section', { class: 'set-card' },
      h('h2', null, t('timing')),
      h('label', { class: 'set-row' }, h('span', null, t('inputOffset')), offsetSlider, offsetOut),
      h('div', { class: 'row' }, calBtn),
      calStatus,
    ),
    h('section', { class: 'set-card' },
      h('h2', null, t('midi')),
      h('div', { class: 'row' }, midiBtn, midiStatus),
    ),
    h('section', { class: 'set-card' },
      h('h2', null, t('data')),
      h('div', { class: 'row' },
        h('button', { class: 'btn ghost', onclick: () => showTutorial(app, () => {}) }, t('showTutorial')),
        h('button', { class: 'btn danger', onclick: () => { if (confirm(t('resetConfirm'))) { app.progress.reset(); app.refresh(); } } }, t('resetProgress')),
      ),
    ),
  );
  return { el, destroy: () => cleanups.forEach((c) => c()) };
}
