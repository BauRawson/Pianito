// Web Audio engine: synthesized piano, accompaniment, metronome, and the authoritative clock.
//
// Time domains:
//  - "ctx time"   AudioContext.currentTime — when sounds are *scheduled*.
//  - "heard time" ctx time of the audio currently leaving the speakers. The game timeline
//                 lives in this domain so visuals and judgement match what the player hears.
// heardAt(performance.now()-style timestamp) maps input/frame timestamps onto heard time
// using AudioContext.getOutputTimestamp() when available (falls back to
// currentTime - outputLatency). The mapping is continuously re-synced, so the
// timeline follows the audio hardware clock and cannot drift over long songs.
import { midiToFreq } from '../core/music';

export interface Voice { stop(atCtxTime?: number): void }
export type Bus = 'piano' | 'music';

interface Volumes { master: number; music: number; metronome: number; muted: boolean }

export class AudioEngine {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private piano!: GainNode;
  private music!: GainNode;
  private clicks!: GainNode;
  private reverbSend!: GainNode;
  private wave!: PeriodicWave;
  private noise!: AudioBuffer;
  private offset: number | null = null;
  private scheduled = new Set<Voice>();
  private volumes: Volumes = { master: 0.8, music: 0.6, metronome: 0.5, muted: false };

  get supported(): boolean {
    return typeof window !== 'undefined' && !!(window.AudioContext || (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext);
  }

  /** Create/resume the context. Call from a user gesture to satisfy autoplay policies. */
  ensure(): AudioContext | null {
    if (!this.supported) return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor({ latencyHint: 'interactive' });
      this.build(this.ctx);
    }
    if (this.ctx.state !== 'running') this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  async ready(): Promise<boolean> {
    const c = this.ensure();
    if (!c) return false;
    if (c.state !== 'running') {
      try { await c.resume(); } catch { /* ignore */ }
    }
    return c.state === 'running';
  }

  get running(): boolean { return this.ctx?.state === 'running'; }

  setVolumes(v: Volumes): void {
    this.volumes = v;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(v.muted ? 0 : v.master, t, 0.02);
    this.music.gain.setTargetAtTime(v.music * 0.9, t, 0.02);
    this.clicks.gain.setTargetAtTime(v.metronome, t, 0.02);
  }

  // ---------------------------------------------------------------- clock

  private sync(): void {
    const c = this.ctx;
    if (!c) return;
    const perfNow = performance.now() / 1000;
    const latency = (c as AudioContext & { outputLatency?: number }).outputLatency || c.baseLatency || 0;
    const fallback = c.currentTime - latency - perfNow;
    let off = fallback;
    try {
      const ts = c.getOutputTimestamp?.();
      if (ts && ts.contextTime && ts.performanceTime) {
        const o = ts.contextTime - ts.performanceTime / 1000;
        if (Math.abs(o - fallback) < 0.5) off = o; // guard against odd implementations
      }
    } catch { /* not supported */ }
    if (this.offset === null || Math.abs(off - this.offset) > 0.03) this.offset = off;
    else this.offset += (off - this.offset) * 0.05; // smooth jitter, follow slow drift
  }

  /** Heard time (seconds) corresponding to a performance.now()/event.timeStamp value in ms. */
  heardAt(perfMs: number): number {
    this.sync();
    return perfMs / 1000 + (this.offset ?? 0);
  }

  heardNow(): number { return this.heardAt(performance.now()); }

  /** Converts a heard time to the ctx time at which a sound must be scheduled. */
  toCtxTime(heard: number): number {
    if (!this.ctx) return 0;
    const lat = Math.min(0.5, Math.max(0, this.ctx.currentTime - this.heardNow()));
    return heard + lat;
  }

  // ---------------------------------------------------------------- sound

  noteOn(midi: number, opts: { velocity?: number; bus?: Bus; when?: number; duration?: number; instrument?: 'voice' } = {}): Voice {
    const c = this.ensure();
    if (!c) return { stop() {} };
    if (opts.instrument === 'voice') return this.vocalNote(midi, opts);
    const vel = opts.velocity ?? 0.8;
    const t = Math.max(opts.when ?? 0, c.currentTime);
    const f = midiToFreq(midi);

    const env = c.createGain();
    const rel = c.createGain();
    const filt = c.createBiquadFilter();
    filt.type = 'lowpass';
    filt.Q.value = 0.7;
    filt.frequency.setValueAtTime(Math.min(16000, f * (5 + vel * 9)), t);
    filt.frequency.setTargetAtTime(Math.max(f * 2.2, 500), t + 0.02, 0.5);

    const o1 = c.createOscillator();
    const o2 = c.createOscillator();
    o1.setPeriodicWave(this.wave);
    o2.setPeriodicWave(this.wave);
    o1.frequency.value = f;
    o2.frequency.value = f;
    o1.detune.value = -3;
    o2.detune.value = 4;

    // Loud attack falling quickly, then a long pitch-dependent decay — piano-like.
    const peak = 0.2 * vel;
    const decay = Math.min(3.5, Math.max(0.5, 2.6 - (midi - 48) * 0.045));
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(peak, t + 0.005);
    env.gain.setTargetAtTime(peak * 0.42, t + 0.005, 0.1);
    env.gain.setTargetAtTime(0.0001, t + 0.35, decay * 0.45);

    o1.connect(filt);
    o2.connect(filt);
    filt.connect(env);
    env.connect(rel);
    const bus = opts.bus === 'music' ? this.music : this.piano;
    rel.connect(bus);
    rel.connect(this.reverbSend);

    // Hammer "thock": short filtered noise burst.
    const hammer = c.createBufferSource();
    hammer.buffer = this.noise;
    const hf = c.createBiquadFilter();
    hf.type = 'bandpass';
    hf.frequency.value = Math.min(9000, f * 3);
    hf.Q.value = 1.2;
    const hg = c.createGain();
    hg.gain.setValueAtTime(0.05 * vel, t);
    hg.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    hammer.connect(hf);
    hf.connect(hg);
    hg.connect(rel);

    const maxEnd = t + decay * 3 + 0.5;
    o1.start(t); o2.start(t); hammer.start(t);
    o1.stop(maxEnd); o2.stop(maxEnd); hammer.stop(t + 0.06);
    o1.onended = () => { [o1, o2, filt, env, rel, hammer, hf, hg].forEach((n) => n.disconnect()); this.scheduled.delete(voice); };

    // `released` = a release is scheduled; an immediate stop() still overrides it
    // (e.g. pausing while scheduled accompaniment is sounding or pending).
    let released = false;
    let cut = false;
    const voice: Voice = {
      stop: (at?: number) => {
        if (cut || !this.ctx) return;
        const now = this.ctx.currentTime;
        if (at === undefined) {
          cut = true;
          if (t > now) {
            // Not started yet: cancel silently.
            try { o1.stop(now); o2.stop(now); hammer.stop(now); } catch { /* ignore */ }
            return;
          }
          rel.gain.cancelScheduledValues(now);
          rel.gain.setTargetAtTime(0, now, 0.06);
          try { o1.stop(now + 0.5); o2.stop(now + 0.5); } catch { /* already stopped */ }
          return;
        }
        if (released) return;
        released = true;
        const r = Math.max(at, t);
        rel.gain.setTargetAtTime(0, r, 0.06);
        try { o1.stop(r + 0.5); o2.stop(r + 0.5); } catch { /* already stopped */ }
      },
    };
    if (opts.duration !== undefined) voice.stop(t + opts.duration);
    if (opts.bus === 'music') this.scheduled.add(voice);
    return voice;
  }

  /** Wordless "ah" guide: vowel formants, a soft envelope and delayed vibrato. */
  private vocalNote(midi: number, opts: { velocity?: number; when?: number; duration?: number }): Voice {
    const c = this.ctx!;
    const t = Math.max(opts.when ?? 0, c.currentTime);
    const source = c.createOscillator();
    source.type = 'sawtooth';
    source.frequency.value = midiToFreq(midi);
    const vibrato = c.createOscillator();
    vibrato.frequency.value = 5.2;
    const depth = c.createGain();
    depth.gain.setValueAtTime(0, t);
    depth.gain.linearRampToValueAtTime(9, t + 0.25);
    vibrato.connect(depth);
    depth.connect(source.detune);

    const envelope = c.createGain();
    envelope.gain.setValueAtTime(0, t);
    envelope.gain.linearRampToValueAtTime(0.55 * (opts.velocity ?? 0.55), t + 0.035);
    // A separate release gain allows pause to override a future scheduled release.
    const release = c.createGain();
    envelope.connect(release);
    release.connect(this.music);
    const nodes: AudioNode[] = [source, vibrato, depth, envelope, release];
    for (const [frequency, gain, q] of [[750, 1, 5], [1150, 0.55, 7], [2600, 0.18, 9]]) {
      const formant = c.createBiquadFilter();
      formant.type = 'bandpass';
      formant.frequency.value = frequency;
      formant.Q.value = q;
      const level = c.createGain();
      level.gain.value = gain;
      source.connect(formant);
      formant.connect(level);
      level.connect(envelope);
      nodes.push(formant, level);
    }

    source.start(t);
    vibrato.start(t);
    let cut = false;
    let released = false;
    const voice: Voice = {
      stop: (at?: number) => {
        if (cut || (at !== undefined && released)) return;
        const now = c.currentTime;
        if (at === undefined) cut = true;
        else released = true;
        const end = at === undefined ? now : Math.max(at, t);
        release.gain.cancelScheduledValues(end);
        release.gain.setTargetAtTime(0, end, 0.025);
        const stopAt = at === undefined && t > now ? now : end + 0.2;
        try { source.stop(stopAt); vibrato.stop(stopAt); } catch { /* already stopped */ }
      },
    };
    source.onended = () => {
      nodes.forEach((n) => n.disconnect());
      this.scheduled.delete(voice);
    };
    this.scheduled.add(voice);
    voice.stop(t + (opts.duration ?? 1));
    return voice;
  }

  /** Metronome click at ctx time `when`. */
  click(when: number, accent: boolean): void {
    const c = this.ctx;
    if (!c) return;
    const t = Math.max(when, c.currentTime);
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.value = accent ? 1760 : 1175;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(accent ? 0.5 : 0.32, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.connect(g);
    g.connect(this.clicks);
    o.start(t);
    o.stop(t + 0.06);
    const v: Voice = { stop: () => { try { o.stop(); } catch { /* ignore */ } } };
    this.scheduled.add(v);
    o.onended = () => { o.disconnect(); g.disconnect(); this.scheduled.delete(v); };
  }

  /** Silence all scheduled accompaniment and metronome sounds (pause/quit/retry). */
  stopScheduled(): void {
    for (const v of [...this.scheduled]) v.stop();
    this.scheduled.clear();
  }

  // ---------------------------------------------------------------- graph

  private build(c: AudioContext): void {
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.knee.value = 12;
    comp.ratio.value = 4;
    comp.attack.value = 0.003;
    comp.release.value = 0.2;
    this.master = c.createGain();
    this.master.connect(comp);
    comp.connect(c.destination);

    this.piano = c.createGain();
    this.music = c.createGain();
    this.clicks = c.createGain();
    this.piano.connect(this.master);
    this.music.connect(this.master);
    this.clicks.connect(this.master);

    // Small synthetic room reverb.
    const len = Math.floor(c.sampleRate * 1.8);
    const ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    const reverb = c.createConvolver();
    reverb.buffer = ir;
    this.reverbSend = c.createGain();
    this.reverbSend.gain.value = 0.16;
    this.reverbSend.connect(reverb);
    reverb.connect(this.master);

    const harmonics = [0, 1, 0.45, 0.25, 0.17, 0.1, 0.07, 0.045, 0.03, 0.02, 0.012];
    this.wave = c.createPeriodicWave(new Float32Array(harmonics.length), new Float32Array(harmonics));

    this.noise = c.createBuffer(1, Math.floor(c.sampleRate * 0.06), c.sampleRate);
    const nd = this.noise.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

    this.setVolumes(this.volumes);
  }
}
