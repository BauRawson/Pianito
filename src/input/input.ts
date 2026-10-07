// Unified note input: computer keyboard (default), touch/pointer, and optional Web MIDI.
// Every source emits the same NoteEvent so all game modes share one input path.
import { KEY_TO_MIDI } from '../core/keymap';

export interface NoteEvent {
  pitch: number;
  on: boolean;
  /** performance.now()-domain timestamp (ms) of the physical event. */
  time: number;
  source: 'key' | 'touch' | 'midi';
}

type Listener = (e: NoteEvent) => void;

export class InputManager {
  private listeners = new Set<Listener>();
  /** Which source/id currently holds each pitch down. */
  private held = new Map<string, number>();
  private midiAccess: MIDIAccess | null = null;
  enabled = true;

  attach(): void {
    window.addEventListener('keydown', this.onKeyDown, { capture: true });
    window.addEventListener('keyup', this.onKeyUp, { capture: true });
    window.addEventListener('blur', this.releaseAll);
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.releaseAll(); });
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Pitches currently held by any source. */
  pressed(): Set<number> {
    return new Set(this.held.values());
  }

  /** Used by touch pianos. `id` distinguishes simultaneous pointers. */
  touch(id: string, pitch: number | null, time: number): void {
    const key = `touch:${id}`;
    const prev = this.held.get(key);
    if (prev === pitch) return;
    if (prev !== undefined) { this.held.delete(key); this.emit({ pitch: prev, on: false, time, source: 'touch' }); }
    if (pitch !== null) { this.held.set(key, pitch); this.emit({ pitch, on: true, time, source: 'touch' }); }
  }

  async enableMidi(): Promise<'ok' | 'unsupported' | 'denied'> {
    if (!('requestMIDIAccess' in navigator)) return 'unsupported';
    try {
      this.midiAccess = await navigator.requestMIDIAccess();
      const bind = () => this.midiAccess!.inputs.forEach((inp) => { inp.onmidimessage = this.onMidi; });
      bind();
      this.midiAccess.onstatechange = bind;
      return 'ok';
    } catch {
      return 'denied';
    }
  }

  midiInputCount(): number { return this.midiAccess ? this.midiAccess.inputs.size : 0; }

  releaseAll = (): void => {
    const t = performance.now();
    for (const [key, pitch] of [...this.held]) {
      this.held.delete(key);
      this.emit({ pitch, on: false, time: t, source: key.startsWith('key') ? 'key' : key.startsWith('midi') ? 'midi' : 'touch' });
    }
  };

  private emit(e: NoteEvent): void {
    if (!this.enabled && e.on) return;
    this.listeners.forEach((l) => l(e));
  }

  private isTyping(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    if (!el || !el.tagName) return false;
    const tag = el.tagName;
    return (tag === 'INPUT' && (el as HTMLInputElement).type !== 'range' && (el as HTMLInputElement).type !== 'checkbox')
      || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    const pitch = KEY_TO_MIDI[e.code];
    if (pitch === undefined || e.ctrlKey || e.metaKey || e.altKey || this.isTyping(e.target)) return;
    e.preventDefault();
    if (e.repeat) return; // auto-repeat is not a new keystroke
    const key = `key:${e.code}`;
    if (this.held.has(key)) return;
    this.held.set(key, pitch);
    this.emit({ pitch, on: true, time: e.timeStamp || performance.now(), source: 'key' });
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    const key = `key:${e.code}`;
    const pitch = this.held.get(key);
    if (pitch === undefined) return;
    e.preventDefault();
    this.held.delete(key);
    this.emit({ pitch, on: false, time: e.timeStamp || performance.now(), source: 'key' });
  };

  private onMidi = (msg: MIDIMessageEvent): void => {
    const d = msg.data;
    if (!d || d.length < 3) return;
    const cmd = d[0] & 0xf0;
    const pitch = d[1];
    const key = `midi:${pitch}`;
    const time = msg.timeStamp || performance.now();
    if (cmd === 0x90 && d[2] > 0) {
      if (this.held.has(key)) return;
      this.held.set(key, pitch);
      this.emit({ pitch, on: true, time, source: 'midi' });
    } else if (cmd === 0x80 || (cmd === 0x90 && d[2] === 0)) {
      if (!this.held.delete(key)) return;
      this.emit({ pitch, on: false, time, source: 'midi' });
    }
  };
}
