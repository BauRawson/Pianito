import { describe, expect, it, vi } from 'vitest';
import { AudioEngine } from '../src/audio/engine';

// Exercise scheduled voice lifecycle without requiring browser audio hardware.
function vocalEngine() {
  const param = () => ({
    value: 0,
    setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(), cancelScheduledValues: vi.fn(),
  });
  const node = () => ({ connect: vi.fn(), disconnect: vi.fn() });
  const oscillators: ReturnType<typeof oscillator>[] = [];
  function oscillator() {
    return { ...node(), frequency: param(), detune: param(), type: 'sine', start: vi.fn(), stop: vi.fn(), onended: null as (() => void) | null };
  }
  const ctx = {
    currentTime: 10,
    createOscillator: () => { const o = oscillator(); oscillators.push(o); return o; },
    createGain: () => ({ ...node(), gain: param() }),
    createBiquadFilter: () => ({ ...node(), frequency: param(), Q: param(), type: 'lowpass' }),
  };
  const engine = new AudioEngine();
  Object.assign(engine, { ctx, music: node() });
  vi.spyOn(engine, 'ensure').mockReturnValue(ctx as unknown as AudioContext);
  return { engine, ctx, oscillators };
}

describe('wordless vocal guide', () => {
  it('schedules on the audio clock and can cancel a future note on pause', () => {
    const { engine, oscillators } = vocalEngine();
    engine.noteOn(60, { instrument: 'voice', bus: 'music', when: 12, duration: 2 });
    expect(oscillators[0].start).toHaveBeenCalledWith(12);
    expect(oscillators[0].stop).toHaveBeenLastCalledWith(14.2);
    engine.stopScheduled();
    for (const o of oscillators) expect(o.stop).toHaveBeenLastCalledWith(10);
  });

  it('cuts a sounding guide on pause even with a release already scheduled', () => {
    const { engine, ctx, oscillators } = vocalEngine();
    engine.noteOn(60, { instrument: 'voice', when: 10, duration: 4 });
    ctx.currentTime = 11;
    engine.stopScheduled();
    for (const o of oscillators) expect(o.stop).toHaveBeenLastCalledWith(11.2);
    oscillators[0].onended!();
    for (const o of oscillators) expect(o.disconnect).toHaveBeenCalledOnce();
  });

  it('does not stop finished voices again when leaving a song', () => {
    const { engine, oscillators } = vocalEngine();
    engine.noteOn(60, { instrument: 'voice', duration: 1 });
    oscillators[0].onended!();
    engine.stopScheduled();
    expect(oscillators[0].stop).toHaveBeenCalledOnce();
  });
});
