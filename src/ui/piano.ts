// A DOM mini-piano used in lesson intros, the tutorial and help screens.
import { h } from './dom';
import { pianoLayout } from '../game/layout';
import { labelForMidi } from '../core/keymap';
import { noteColor, noteName, MIDDLE_C, type Naming } from '../core/music';

export interface MiniPiano {
  el: HTMLElement;
  setPressed(pressed: ReadonlySet<number>): void;
  mark(midi: number, cls: string, on: boolean): void;
}

export function miniPiano(lo: number, hi: number, opts: {
  highlight?: number[];
  naming: Naming;
  showKeys?: boolean;
  showNames?: boolean;
  onPress?: (midi: number, on: boolean) => void;
}): MiniPiano {
  const el = h('div', { class: 'mini-piano', role: 'group', 'aria-label': 'Piano' });
  const keys = new Map<number, HTMLElement>();
  const highlight = new Set(opts.highlight ?? []);
  for (const r of pianoLayout(lo, hi, 100)) {
    const letter = labelForMidi(r.midi);
    const k = h('div', {
      class: `mk ${r.black ? 'black' : 'white'}${highlight.has(r.midi) ? ' hl' : ''}${r.midi === MIDDLE_C ? ' middle-c' : ''}`,
      style: `left:${r.x}%;width:${r.w}%;--c:${noteColor(r.midi)}`,
      'data-midi': r.midi,
    },
      opts.showKeys !== false && letter ? h('b', null, letter) : null,
      opts.showNames !== false ? h('small', null, noteName(r.midi, opts.naming, !r.black)) : null,
    );
    keys.set(r.midi, k);
    el.append(k);
  }
  if (opts.onPress) {
    const active = new Map<number, number>();
    el.addEventListener('pointerdown', (e) => {
      const target = (e.target as HTMLElement).closest('.mk') as HTMLElement | null;
      if (!target) return;
      e.preventDefault();
      const m = Number(target.dataset.midi);
      active.set(e.pointerId, m);
      opts.onPress!(m, true);
    });
    const up = (e: PointerEvent) => {
      const m = active.get(e.pointerId);
      if (m === undefined) return;
      active.delete(e.pointerId);
      opts.onPress!(m, false);
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', up);
  }
  return {
    el,
    setPressed(pressed) {
      for (const [m, k] of keys) k.classList.toggle('down', pressed.has(m));
    },
    mark(midi, cls, on) { keys.get(midi)?.classList.toggle(cls, on); },
  };
}
