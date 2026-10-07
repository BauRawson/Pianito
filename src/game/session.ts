// A single play-through of a song. Owns the musical timeline, the accompaniment/metronome
// scheduler, the judge and the render loop. The audio clock (AudioEngine.heardAt) is the
// sole source of truth for time — frames only *sample* it.
import { buildChart, type Chart } from '../core/chart';
import { Judge, type JudgeEvent, type JudgeStats } from '../core/judge';
import { lookaheadFor, type SettingsStore } from '../core/settings';
import type { AudioEngine, Voice } from '../audio/engine';
import type { InputManager, NoteEvent } from '../input/input';
import type { Song } from '../data/types';
import { Renderer } from './renderer';
import { rangeFor } from './layout';
import { t } from '../i18n';

export interface SessionOptions {
  song: Song;
  rate: number;
  staff: boolean;
  metronome: boolean;
  focus?: number[];
  /** Touch device: taller keys, note names instead of computer-key letters. */
  mobile?: boolean;
}

export interface HudState { score: number; combo: number; accuracy: number; progress: number }

export interface SessionResult extends JudgeStats { songId: string; notes: number }

export interface SessionHooks {
  hud(h: HudState): void;
  end(r: SessionResult): void;
}

type Phase = 'countin' | 'playing' | 'paused' | 'resuming' | 'ended';
const SCHEDULE_AHEAD = 0.2; // seconds of audio scheduled in advance
const RESUME_DELAY = 1.2;

export class GameSession {
  readonly chart: Chart;
  readonly judge: Judge;
  private renderer: Renderer;
  private range: { lo: number; hi: number };
  private phase: Phase = 'countin';
  /** Heard time at which song time = 0 (first beat). */
  private origin = 0;
  private pausedAt = 0;
  private resumeAt = 0;
  private leadIn: number;
  private raf = 0;
  private timer = 0;
  private accompCursor = 0;
  private nextClickBeat: number;
  private voices = new Map<number, Voice>();
  private unsub: () => void;
  private lastHud = '';
  private focus: Set<number>;
  metronome: boolean;

  constructor(
    canvas: HTMLCanvasElement,
    private opts: SessionOptions,
    private audio: AudioEngine,
    private input: InputManager,
    private settings: SettingsStore,
    private hooks: SessionHooks,
  ) {
    this.chart = buildChart(opts.song, opts.rate);
    this.judge = new Judge(this.chart.notes);
    this.renderer = new Renderer(canvas);
    this.renderer.reducedMotion = settings.reducedMotion();
    this.renderer.mobile = !!opts.mobile;
    this.range = rangeFor(this.chart.notes.map((n) => n.pitch));
    this.metronome = opts.metronome;
    this.focus = new Set(opts.focus ?? []);
    const bar = this.chart.beatDur * this.chart.beatsPerBar;
    // Long enough for one count-in bar and for the first notes to fall from the top.
    this.leadIn = Math.ceil((Math.max(bar, lookaheadFor(settings.get().noteSpeed)) + 0.6) / this.chart.beatDur) * this.chart.beatDur;
    this.nextClickBeat = -Math.round(this.leadIn / this.chart.beatDur);
    this.unsub = input.subscribe(this.onNote);
  }

  resize(): void { this.renderer.resize(); }

  start(): void {
    this.renderer.resize();
    this.origin = this.audio.heardNow() + this.leadIn;
    this.phase = 'countin';
    this.raf = requestAnimationFrame(this.frame);
    // The scheduler runs on a timer so audio keeps flowing even if frames hitch.
    this.timer = window.setInterval(this.schedule, 25);
    this.schedule();
  }

  /** Song time in seconds at a given heard time. */
  private songTimeAt(heard: number): number {
    if (this.phase === 'paused' || this.phase === 'resuming') return this.pausedAt;
    return heard - this.origin;
  }

  now(): number { return this.songTimeAt(this.audio.heardNow()); }

  get paused(): boolean { return this.phase === 'paused' || this.phase === 'resuming'; }

  pause(): void {
    if (this.phase === 'ended' || this.phase === 'paused') return;
    this.pausedAt = this.now();
    this.phase = 'paused';
    this.audio.stopScheduled();
    this.releaseVoices();
  }

  resume(): void {
    if (this.phase !== 'paused') return;
    this.phase = 'resuming';
    this.resumeAt = performance.now() + RESUME_DELAY * 1000;
  }

  destroy(): void {
    this.phase = 'ended';
    cancelAnimationFrame(this.raf);
    clearInterval(this.timer);
    this.unsub();
    this.audio.stopScheduled();
    this.releaseVoices();
  }

  private releaseVoices(): void {
    for (const v of this.voices.values()) v.stop();
    this.voices.clear();
  }

  private schedule = (): void => {
    if (this.phase === 'paused' || this.phase === 'resuming' || this.phase === 'ended') return;
    const heardNow = this.audio.heardNow();
    const horizon = heardNow - this.origin + SCHEDULE_AHEAD;
    const acc = this.chart.accomp;
    while (this.accompCursor < acc.length && acc[this.accompCursor].time < horizon) {
      const ev = acc[this.accompCursor++];
      const songT = ev.time;
      if (songT < heardNow - this.origin - 0.05) continue; // skip stale events after resume
      this.audio.noteOn(ev.pitch, { bus: 'music', instrument: ev.instrument, velocity: 0.55, when: this.audio.toCtxTime(this.origin + songT), duration: ev.dur });
    }
    const beatDur = this.chart.beatDur;
    const lastBeat = Math.ceil(this.chart.duration / beatDur);
    while (this.nextClickBeat * beatDur < horizon && this.nextClickBeat < lastBeat) {
      const b = this.nextClickBeat++;
      const songT = b * beatDur;
      if (songT < heardNow - this.origin - 0.05) continue;
      // Count-in clicks always play; afterwards only if the metronome is on.
      const countIn = b < 0 && b >= -this.chart.beatsPerBar;
      if (countIn || (b >= 0 && this.metronome)) {
        const accent = ((b % this.chart.beatsPerBar) + this.chart.beatsPerBar) % this.chart.beatsPerBar === 0;
        this.audio.click(this.audio.toCtxTime(this.origin + songT), accent);
      }
    }
  };

  private onNote = (e: NoteEvent): void => {
    if (this.phase === 'ended') return;
    if (e.on) {
      this.voices.get(e.pitch)?.stop();
      this.voices.set(e.pitch, this.audio.noteOn(e.pitch, { velocity: 0.85 }));
    } else {
      this.voices.get(e.pitch)?.stop();
      this.voices.delete(e.pitch);
    }
    if (this.paused) return;
    const offset = this.settings.get().inputOffsetMs / 1000;
    const songT = this.songTimeAt(this.audio.heardAt(e.time)) - offset;
    const events = e.on ? this.judge.press(e.pitch, songT) : this.judge.release(e.pitch, songT);
    this.handle(events);
  };

  private handle(events: JudgeEvent[]): void {
    const now = performance.now();
    for (const ev of events) {
      switch (ev.type) {
        case 'hit':
          this.renderer.hit(ev.note.pitch, ev.grade, now);
          this.renderer.showPopup(t(ev.grade), ev.grade, now, this.judge.combo >= 5 ? `${this.judge.combo} ${t('combo')}` : undefined);
          break;
        case 'miss':
          this.renderer.showPopup(t('miss'), 'miss', now);
          break;
        case 'hold-ok':
          this.renderer.hit(ev.note.pitch, 'perfect', now);
          break;
        case 'hold-break':
          this.renderer.showPopup(t('released'), 'miss', now);
          break;
        case 'chord':
          this.renderer.showPopup(t('chord'), 'chord', now, this.judge.combo >= 5 ? `${this.judge.combo} ${t('combo')}` : undefined);
          break;
      }
    }
  }

  private frame = (): void => {
    if (this.phase === 'ended') return;
    this.raf = requestAnimationFrame(this.frame);
    const perf = performance.now();
    if (this.phase === 'resuming' && perf >= this.resumeAt) {
      this.origin = this.audio.heardNow() - this.pausedAt;
      this.phase = 'playing';
      this.accompCursor = this.chart.accomp.findIndex((a) => a.time >= this.pausedAt - 0.01);
      if (this.accompCursor < 0) this.accompCursor = this.chart.accomp.length;
      this.nextClickBeat = Math.ceil(this.pausedAt / this.chart.beatDur);
    }
    const time = this.now();
    if (this.phase === 'countin' && time >= 0) this.phase = 'playing';
    if (this.phase === 'playing') this.handle(this.judge.update(time));

    const s = this.settings.get();
    let banner: string | null = null;
    if (this.phase === 'countin') {
      const beatsLeft = Math.ceil(-time / this.chart.beatDur);
      banner = beatsLeft <= this.chart.beatsPerBar ? String(beatsLeft) : t('getReady');
    } else if (this.phase === 'paused') banner = t('paused');
    else if (this.phase === 'resuming') banner = String(Math.ceil((this.resumeAt - perf) / 400));

    this.renderer.draw({
      time,
      lookahead: lookaheadFor(s.noteSpeed),
      notes: this.chart.notes,
      states: this.judge.state,
      lo: this.range.lo,
      hi: this.range.hi,
      pressed: this.input.pressed(),
      beatDur: this.chart.beatDur,
      beatsPerBar: this.chart.beatsPerBar,
      beatStart: -this.chart.beatDur * this.chart.beatsPerBar,
      labels: this.opts.mobile ? 'notes' : s.labels,
      naming: this.settings.naming(),
      staff: this.opts.staff,
      highlight: this.focus,
      banner,
    }, perf);

    const hud: HudState = {
      score: this.judge.score,
      combo: this.judge.combo,
      accuracy: this.judge.accuracy,
      progress: Math.min(1, Math.max(0, time / this.chart.duration)),
    };
    const key = `${hud.score}|${hud.combo}|${hud.accuracy.toFixed(3)}|${hud.progress.toFixed(2)}`;
    if (key !== this.lastHud) { this.lastHud = key; this.hooks.hud(hud); }

    if (this.phase === 'playing' && this.judge.done() && time > this.chart.duration + 0.6) {
      const stats = this.judge.stats();
      this.destroy();
      this.hooks.end({ ...stats, songId: this.opts.song.id, notes: this.chart.notes.length });
    }
  };

  /** Touch support: map a pointer on the canvas to a piano key. */
  keyAt(x: number, y: number): number | null { return this.renderer.keyAt(x, y); }
}
