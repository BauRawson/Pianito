// Modal dialogs: first-launch tutorial, keyboard map, and the piano-keyboard explainer.
import type { App } from './app';
import { h, modal } from './dom';
import { miniPiano } from './piano';
import { t } from '../i18n';
import { KEY_TO_MIDI, keyLabel } from '../core/keymap';
import { isBlack, noteColor, noteName } from '../core/music';

export function showTutorial(app: App, onDone: () => void): void {
  let step = 0;
  const body = h('div', { class: 'tutorial' });
  let unsub: (() => void) | null = null;
  const finish = () => {
    unsub?.();
    app.progress.tutorialSeen = true;
    close();
  };
  const close = modal(body, { onClose: () => { unsub?.(); app.progress.tutorialSeen = true; onDone(); } });

  const render = () => {
    unsub?.();
    unsub = null;
    const dots = h('div', { class: 'dots' }, [0, 1, 2, 3].map((i) => h('span', { class: i === step ? 'on' : '' })));
    const naming = app.settings.naming();
    let content: HTMLElement;
    if (step === 0) {
      content = h('div', null,
        h('h2', null, t('tut1Title')),
        h('p', null, t('tut1Text')),
        h('div', { class: 'tut-demo', 'aria-hidden': 'true' },
          h('div', { class: 'demo-note n1' }, 'A'), h('div', { class: 'demo-note n2' }, 'D'), h('div', { class: 'demo-note n3' }, 'G'),
          h('div', { class: 'demo-line' })),
      );
    } else if (step === 1) {
      const piano = miniPiano(60, 67, { naming, highlight: [60], onPress: (m, on) => app.input.touch('tut', on ? m : null, performance.now()) });
      const status = h('p', { class: 'tut-status' }, '');
      unsub = app.input.subscribe((e) => {
        piano.setPressed(app.input.pressed());
        if (e.on && e.pitch === 60) { status.textContent = t('tut2Done'); status.classList.add('ok'); }
      });
      content = h('div', null, h('h2', null, t('tut2Title')), h('p', null, t('tut2Text')), piano.el, status);
    } else if (step === 2) {
      content = h('div', null, h('h2', null, t('tut3Title')), h('p', null, t('tut3Text')));
    } else {
      content = h('div', null, h('h2', null, t('tut4Title')), h('p', null, t('honestText')));
    }
    body.replaceChildren(
      content,
      dots,
      h('div', { class: 'row end' },
        step < 3 ? h('button', { class: 'btn ghost', onclick: finish }, t('skip')) : null,
        h('button', { class: 'btn primary', onclick: () => { if (step < 3) { step++; render(); } else finish(); } }, step < 3 ? t('next') : t('letsGo')),
      ),
    );
    (body.querySelector('.btn.primary') as HTMLElement | null)?.focus();
  };
  render();
}

export function showKeysHelp(): void {
  const rows: string[][] = [
    ['KeyW', 'KeyE', '', 'KeyT', 'KeyY', 'KeyU', '', 'KeyO', 'KeyP'],
    ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote'],
    ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM'],
  ];
  const cap = (code: string) => {
    if (!code) return h('span', { class: 'kcap gap' });
    const m = KEY_TO_MIDI[code];
    return h('span', { class: `kcap${isBlack(m) ? ' black' : ''}`, style: `--c:${noteColor(m)}` },
      h('b', null, keyLabel(code)), h('small', null, noteName(m, 'letter')));
  };
  const ok = h('button', { class: 'btn primary' }, 'OK');
  const close = modal(h('div', { class: 'keys-help' },
    h('h2', null, t('keysHelp')),
    h('p', null, t('keysHelpText')),
    h('div', { class: 'kb' },
      h('div', { class: 'kb-row r0' }, rows[0].map(cap)),
      h('div', { class: 'kb-row r1' }, rows[1].map(cap)),
      h('div', { class: 'kb-row r2' }, rows[2].map(cap)),
    ),
    h('p', { class: 'muted small' }, t('ghosting')),
    h('div', { class: 'row end' }, ok),
  ));
  ok.addEventListener('click', () => close());
}

export function showPianoGuide(app: App): void {
  const naming = app.settings.naming();
  const es = app.settings.get().lang === 'es';
  const piano = miniPiano(48, 83, { naming, highlight: [60], showKeys: false, onPress: (m, on) => app.input.touch('guide', on ? m : null, performance.now()) });
  const unsub = app.input.subscribe(() => piano.setPressed(app.input.pressed()));
  const p = (en: string, esText: string) => h('li', null, es ? esText : en);
  const close = modal(h('div', { class: 'piano-guide' },
    h('h2', null, t('pianoGuide')),
    piano.el,
    h('ul', { class: 'guide-list' },
      p('Black keys come in alternating groups of 2 and 3. They are your map.', 'Las teclas negras se alternan en grupos de 2 y de 3. Son tu mapa.'),
      p('C sits just left of every group of 2; F sits just left of every group of 3.', 'Do está justo a la izquierda de cada grupo de 2; Fa, a la izquierda de cada grupo de 3.'),
      p('White keys repeat the 7 names C D E F G A B. Every 12 keys (7 white + 5 black) the pattern repeats one octave higher.', 'Las teclas blancas repiten 7 nombres: Do Re Mi Fa Sol La Si. Cada 12 teclas (7 blancas + 5 negras) el patrón se repite una octava más arriba.'),
      p('Middle C (C4, red dot) is the centre of the piano and your home base.', 'El Do central (Do4, punto rojo) es el centro del piano y tu punto de partida.'),
      p('Going right = higher pitch. Going left = lower pitch.', 'Hacia la derecha = más agudo. Hacia la izquierda = más grave.'),
      p('A real piano has 88 keys — over seven octaves. Pianito shows the part your keyboard can reach.', 'Un piano real tiene 88 teclas, más de siete octavas. Pianito muestra la parte que alcanza tu teclado.'),
    ),
    h('p', { class: 'honest' }, h('strong', null, t('honestTitle') + ': '), t('honestText')),
    h('div', { class: 'row end' }, h('button', { class: 'btn primary', onclick: () => close() }, 'OK')),
  ), { onClose: unsub });
}
