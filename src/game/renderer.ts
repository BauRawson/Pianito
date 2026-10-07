// Canvas renderer for the note highway, piano keyboard, staff strip and effects.
// Purely visual: it receives a frame description and never touches game state.
import type { ChartNote } from '../core/chart';
import type { NoteState, Grade } from '../core/judge';
import { noteColor, noteName, staffPosition, MIDDLE_C, type Naming } from '../core/music';
import { labelForMidi } from '../core/keymap';
import type { LabelMode } from '../core/settings';
import { pianoLayout, type KeyRect } from './layout';

export interface Frame {
  /** Song time in seconds (beat 0 = 0). */
  time: number;
  lookahead: number;
  notes: ChartNote[] | null;
  states: NoteState[] | null;
  lo: number;
  hi: number;
  pressed: ReadonlySet<number>;
  beatDur: number;
  beatsPerBar: number;
  /** Earliest time at which beat lines are drawn (count-in start). */
  beatStart: number;
  labels: LabelMode;
  naming: Naming;
  staff: boolean;
  /** Keys to softly highlight on the piano (lesson focus). */
  highlight?: ReadonlySet<number>;
  /** Large centred overlay text (count-in). */
  banner?: string | null;
}

interface Particle { x: number; y: number; vx: number; vy: number; color: string; t0: number }
interface Popup { text: string; color: string; t0: number; sub?: string }
interface Trail { pitch: number; start: number; end: number | null }

const FONT = 'ui-rounded, "SF Pro Rounded", "Nunito", "Segoe UI", system-ui, sans-serif';
const GRADE_COLOR: Record<Grade | 'hold' | 'chord', string> = {
  perfect: '#ffe066', great: '#5ce1e6', good: '#9be38a', miss: '#ff6b81', hold: '#c9a7ff', chord: '#ffb3e6',
};

function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
}

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt);
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

export class Renderer {
  private c: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private rects: KeyRect[] = [];
  private rectByMidi = new Map<number, KeyRect>();
  private layoutKey = '';
  private flashes = new Map<number, { t0: number; color: string }>();
  private particles: Particle[] = [];
  private popup: Popup | null = null;
  private trails: Trail[] = [];
  reducedMotion = false;
  /** Touch devices: taller keys for fingers. */
  mobile = false;
  /** Free-play mode: rising trails instead of falling notes. */
  trailsEnabled = false;
  pianoTop = 0;

  constructor(readonly canvas: HTMLCanvasElement) {
    this.c = canvas.getContext('2d', { alpha: false })!;
  }

  resize(): void {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = Math.max(1, r.width);
    this.h = Math.max(1, r.height);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.layoutKey = '';
  }

  /** Piano key under a canvas-relative CSS pixel position (for touch play). */
  keyAt(x: number, y: number): number | null {
    if (y < this.pianoTop) return null;
    const pianoH = this.h - this.pianoTop;
    const blackBottom = this.pianoTop + pianoH * 0.62;
    if (y <= blackBottom) {
      for (const r of this.rects) if (r.black && x >= r.x && x <= r.x + r.w) return r.midi;
    }
    for (const r of this.rects) if (!r.black && x >= r.x && x <= r.x + r.w) return r.midi;
    return null;
  }

  hit(pitch: number, grade: Grade, now: number): void {
    const color = grade === 'miss' ? GRADE_COLOR.miss : noteColor(pitch);
    if (grade !== 'miss') this.flashes.set(pitch, { t0: now, color });
    const r = this.rectByMidi.get(pitch);
    if (r && grade !== 'miss' && !this.reducedMotion) {
      const count = grade === 'perfect' ? 12 : 7;
      for (let i = 0; i < count; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.8;
        const sp = 120 + Math.random() * 220;
        this.particles.push({ x: r.x + r.w / 2, y: this.pianoTop, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, color, t0: now });
      }
    }
  }

  showPopup(text: string, kind: Grade | 'hold' | 'chord', now: number, sub?: string): void {
    this.popup = { text, color: GRADE_COLOR[kind], t0: now, sub };
  }

  trailOn(pitch: number, now: number): void { this.trails.push({ pitch, start: now, end: null }); }
  trailOff(pitch: number, now: number): void {
    for (const t of this.trails) if (t.pitch === pitch && t.end === null) t.end = now;
  }

  clearEffects(): void {
    this.flashes.clear();
    this.particles = [];
    this.popup = null;
    this.trails = [];
  }

  draw(f: Frame, now: number): void {
    const c = this.c;
    const { w, h } = this;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const pianoH = this.mobile ? Math.max(110, Math.min(280, h * 0.42)) : Math.max(80, Math.min(170, h * 0.22));
    const pianoY = h - pianoH;
    this.pianoTop = pianoY;
    const staffH = f.staff ? Math.max(84, Math.min(120, h * 0.17)) : 0;
    const top = staffH;
    const lineY = pianoY;

    const key = `${f.lo}-${f.hi}-${w}`;
    if (key !== this.layoutKey) {
      this.rects = pianoLayout(f.lo, f.hi, w);
      this.rectByMidi = new Map(this.rects.map((r) => [r.midi, r]));
      this.layoutKey = key;
    }

    // Highway background
    const bg = c.createLinearGradient(0, top, 0, lineY);
    bg.addColorStop(0, '#191733');
    bg.addColorStop(1, '#2b2655');
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);

    // Lanes aligned with keys: black-key lanes are darker strips.
    for (const r of this.rects) {
      if (r.black) {
        c.fillStyle = 'rgba(0,0,0,0.22)';
        c.fillRect(r.x, top, r.w, lineY - top);
      } else {
        c.fillStyle = 'rgba(255,255,255,0.06)';
        c.fillRect(r.x, top, 1, lineY - top);
        if (f.highlight?.has(r.midi)) {
          c.fillStyle = 'rgba(255,255,255,0.035)';
          c.fillRect(r.x, top, r.w, lineY - top);
        }
      }
    }

    const pps = (lineY - top) / f.lookahead;

    // Beat and bar lines
    if (f.beatDur > 0) {
      const first = Math.max(Math.ceil(f.beatStart / f.beatDur), Math.ceil((f.time - 0.2) / f.beatDur));
      const last = Math.floor((f.time + f.lookahead) / f.beatDur);
      for (let b = first; b <= last; b++) {
        const y = lineY - (b * f.beatDur - f.time) * pps;
        const bar = ((b % f.beatsPerBar) + f.beatsPerBar) % f.beatsPerBar === 0;
        c.fillStyle = bar ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.05)';
        c.fillRect(0, y, w, bar ? 2 : 1);
      }
    }

    // Falling notes
    if (f.notes && f.states) {
      c.save();
      c.beginPath();
      c.rect(0, top, w, lineY - top + 2);
      c.clip();
      for (const n of f.notes) {
        if (n.time - f.time > f.lookahead + 0.2) break;
        if (n.end - f.time < -0.6) continue;
        const st = f.states[n.id];
        const r = this.rectByMidi.get(n.pitch);
        if (!r) continue;
        const holding = n.hold && st.hold === 'holding';
        if (st.grade && st.grade !== 'miss' && !holding) continue; // hit notes vanish
        this.drawNote(f, n, r, lineY, pps, st.grade === 'miss', holding);
      }
      c.restore();
    }

    // Free-play trails rise from the keys.
    if (this.trailsEnabled) this.drawTrails(lineY, now);

    // Judgment line
    const glow = c.createLinearGradient(0, lineY - 14, 0, lineY);
    glow.addColorStop(0, 'rgba(255,255,255,0)');
    glow.addColorStop(1, 'rgba(255,255,255,0.18)');
    c.fillStyle = glow;
    c.fillRect(0, lineY - 14, w, 14);
    c.fillStyle = '#ffffff';
    c.fillRect(0, lineY - 2, w, 3);

    this.drawPiano(f, pianoY, pianoH, now);
    this.drawParticles(now);
    if (f.staff) this.drawStaff(f, staffH);
    this.drawPopup(top, lineY, now);
    if (f.banner) this.drawBanner(f.banner, top, lineY);
  }

  private drawNote(f: Frame, n: ChartNote, r: KeyRect, lineY: number, pps: number, missed: boolean, holding: boolean): void {
    const c = this.c;
    const black = r.black;
    const inset = black ? 1 : 3;
    const x = r.x + inset;
    const nw = r.w - inset * 2;
    const color = noteColor(n.pitch);
    const yHead = lineY - (n.time - f.time) * pps;
    const fullLen = (n.end - n.time) * pps;
    const tileMax = f.labels === 'both' ? 48 : 38;
    const tileH = Math.max(14, Math.min(tileMax, fullLen - 4));

    c.globalAlpha = missed ? 0.28 : 1;
    const fill = missed ? '#8a87a8' : black ? shade(color, -0.35) : color;

    if (n.hold) {
      const yTail = lineY - (n.end - f.time) * pps;
      const bottom = holding ? lineY : yHead - tileH * 0.5;
      const bw = nw * 0.5;
      c.fillStyle = missed ? fill : shade(color, holding ? 0.2 : -0.1);
      c.globalAlpha = missed ? 0.25 : holding ? 0.95 : 0.7;
      rr(c, x + (nw - bw) / 2, yTail, bw, Math.max(0, bottom - yTail), bw / 2);
      c.fill();
      if (holding && !this.reducedMotion) {
        c.shadowColor = color;
        c.shadowBlur = 18;
        c.fill();
        c.shadowBlur = 0;
      }
      c.globalAlpha = missed ? 0.28 : 1;
      // Tail cap marks where to release.
      c.fillStyle = missed ? fill : '#ffffff';
      rr(c, x + nw * 0.15, yTail - 3, nw * 0.7, 6, 3);
      c.fill();
      if (holding) { c.globalAlpha = 1; return; }
    }

    // Head tile
    const y = yHead - tileH;
    c.fillStyle = fill;
    rr(c, x, y, nw, tileH, Math.min(8, nw / 4));
    c.fill();
    if (!missed) {
      c.fillStyle = 'rgba(255,255,255,0.28)';
      rr(c, x + 2, y + 2, nw - 4, Math.min(6, tileH / 3), 3);
      c.fill();
      if (black) {
        c.strokeStyle = color;
        c.lineWidth = 2;
        rr(c, x + 1, y + 1, nw - 2, tileH - 2, Math.min(7, nw / 4));
        c.stroke();
      }
    }
    this.drawLabels(f, n.pitch, x, y, nw, tileH, black || missed);
    c.globalAlpha = 1;
  }

  private drawLabels(f: Frame, pitch: number, x: number, y: number, w: number, h: number, lightText: boolean): void {
    const c = this.c;
    const letter = labelForMidi(pitch);
    const name = noteName(pitch, f.naming);
    let big: string | undefined;
    let small: string | undefined;
    if (f.labels === 'keys') big = letter;
    else if (f.labels === 'notes') big = name;
    else { big = letter ?? name; small = letter ? name : undefined; }
    if (!big) return;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const cx = x + w / 2;
    const showSmall = small && h >= 36 && w >= 22;
    const bigSize = Math.max(10, Math.min(22, w * 0.55, h * (showSmall ? 0.45 : 0.62)));
    c.fillStyle = lightText ? '#ffffff' : '#1d1838';
    c.font = `800 ${bigSize}px ${FONT}`;
    c.fillText(big, cx, showSmall ? y + h * 0.38 : y + h / 2 + 1);
    if (showSmall) {
      c.font = `700 ${Math.max(8, Math.min(11, w * 0.3))}px ${FONT}`;
      c.globalAlpha *= 0.8;
      c.fillText(small!, cx, y + h * 0.74);
      c.globalAlpha /= 0.8;
    }
  }

  private drawPiano(f: Frame, y: number, ph: number, now: number): void {
    const c = this.c;
    c.fillStyle = '#121022';
    c.fillRect(0, y, this.w, ph);
    const bh = ph * 0.62;
    const flashAlpha = (m: number) => {
      const fl = this.flashes.get(m);
      if (!fl) return 0;
      const a = 1 - (now - fl.t0) / 280;
      if (a <= 0) { this.flashes.delete(m); return 0; }
      return a;
    };

    for (const r of this.rects) {
      if (r.black) continue;
      const down = f.pressed.has(r.midi);
      const color = noteColor(r.midi);
      const yy = y + (down ? 3 : 1);
      c.fillStyle = down ? shade(color, 0.55) : f.highlight?.has(r.midi) ? '#fff6dc' : '#fbfaf6';
      rr(c, r.x + 1, yy, r.w - 2, ph - 4, 6);
      c.fill();
      const fa = flashAlpha(r.midi);
      if (fa > 0) {
        c.globalAlpha = fa * 0.85;
        c.fillStyle = color;
        rr(c, r.x + 1, yy, r.w - 2, ph - 4, 6);
        c.fill();
        c.globalAlpha = 1;
      }
      // Bottom labels
      const letter = labelForMidi(r.midi);
      c.textAlign = 'center';
      c.textBaseline = 'alphabetic';
      const fs = Math.max(9, Math.min(16, r.w * 0.38));
      if (letter && f.labels !== 'notes') {
        c.font = `800 ${fs}px ${FONT}`;
        c.fillStyle = '#2b2655';
        c.fillText(letter, r.x + r.w / 2, y + ph - 12 - (f.labels === 'both' ? fs * 0.9 : 0));
      }
      if (f.labels !== 'keys' || !letter) {
        c.font = `600 ${Math.max(8, fs * 0.72)}px ${FONT}`;
        c.fillStyle = '#7d7898';
        c.fillText(noteName(r.midi, f.naming), r.x + r.w / 2, y + ph - 10);
      }
      if (r.midi === MIDDLE_C) {
        c.fillStyle = '#ff4d6d';
        c.beginPath();
        c.arc(r.x + r.w / 2, y + bh + 12, 3.5, 0, Math.PI * 2);
        c.fill();
      }
    }
    for (const r of this.rects) {
      if (!r.black) continue;
      const down = f.pressed.has(r.midi);
      const color = noteColor(r.midi);
      const g = c.createLinearGradient(0, y, 0, y + bh);
      g.addColorStop(0, down ? shade(color, -0.1) : '#3a3656');
      g.addColorStop(1, down ? shade(color, -0.35) : '#14121f');
      c.fillStyle = g;
      rr(c, r.x, y - 2, r.w, bh + (down ? 2 : 0), 4);
      c.fill();
      if (f.highlight?.has(r.midi) && !down) {
        c.strokeStyle = 'rgba(255,214,90,0.8)';
        c.lineWidth = 2;
        c.stroke();
      }
      const fa = flashAlpha(r.midi);
      if (fa > 0) {
        c.globalAlpha = fa * 0.9;
        c.fillStyle = color;
        rr(c, r.x, y - 2, r.w, bh, 4);
        c.fill();
        c.globalAlpha = 1;
      }
      const letter = labelForMidi(r.midi);
      if (letter && f.labels !== 'notes') {
        c.textAlign = 'center';
        c.font = `800 ${Math.max(8, Math.min(13, r.w * 0.5))}px ${FONT}`;
        c.fillStyle = '#ffffff';
        c.fillText(letter, r.x + r.w / 2, y + bh - 8);
      } else if (f.labels === 'notes') {
        c.textAlign = 'center';
        c.font = `700 ${Math.max(7, Math.min(10, r.w * 0.36))}px ${FONT}`;
        c.fillStyle = '#d8d4f0';
        c.fillText(noteName(r.midi, f.naming, false), r.x + r.w / 2, y + bh - 8);
      }
    }
    // Pressed-key glow on the judgment line
    for (const m of f.pressed) {
      const r = this.rectByMidi.get(m);
      if (!r) continue;
      c.fillStyle = noteColor(m);
      c.globalAlpha = 0.85;
      c.fillRect(r.x + 2, y - 5, r.w - 4, 4);
      c.globalAlpha = 1;
    }
  }

  private drawParticles(now: number): void {
    const c = this.c;
    const life = 520;
    this.particles = this.particles.filter((p) => now - p.t0 < life);
    for (const p of this.particles) {
      const dt = (now - p.t0) / 1000;
      const x = p.x + p.vx * dt;
      const y = p.y + p.vy * dt + 400 * dt * dt;
      c.globalAlpha = 1 - (now - p.t0) / life;
      c.fillStyle = p.color;
      c.fillRect(x - 2.5, y - 2.5, 5, 5);
    }
    c.globalAlpha = 1;
  }

  private drawTrails(lineY: number, now: number): void {
    const c = this.c;
    const speed = 0.16; // px per ms
    this.trails = this.trails.filter((t) => t.end === null || lineY - (now - t.end) * speed > -50);
    for (const t of this.trails) {
      const r = this.rectByMidi.get(t.pitch);
      if (!r) continue;
      const bottom = t.end === null ? lineY : lineY - (now - t.end) * speed;
      const topY = lineY - (now - t.start) * speed;
      const inset = r.black ? 1 : 3;
      const color = noteColor(t.pitch);
      c.globalAlpha = 0.85;
      c.fillStyle = r.black ? shade(color, -0.25) : color;
      rr(c, r.x + inset, topY, r.w - inset * 2, Math.max(4, bottom - topY), 6);
      c.fill();
    }
    c.globalAlpha = 1;
  }

  private drawStaff(f: Frame, sh: number): void {
    const c = this.c;
    const w = this.w;
    c.fillStyle = '#fffaf0';
    c.fillRect(0, 0, w, sh);
    c.fillStyle = 'rgba(43,38,85,0.12)';
    c.fillRect(0, sh - 2, w, 2);
    const gap = Math.min(9, sh / 11);
    const bottomLine = sh / 2 + gap * 2; // E4 line
    const stepY = (step: number) => bottomLine - (step - 30) * (gap / 2); // E4 = step 30
    c.strokeStyle = '#2b2655';
    c.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = bottomLine - i * gap;
      c.beginPath();
      c.moveTo(8, y);
      c.lineTo(w - 8, y);
      c.stroke();
    }
    c.fillStyle = '#2b2655';
    c.font = `${gap * 6.2}px "Noto Music", "Bravura", "Segoe UI Symbol", serif`;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.fillText('𝄞', 10, bottomLine + gap * 1.3);

    const playX = 78;
    const span = Math.max(2.5, f.lookahead * 1.5);
    const spx = (w - playX - 10) / span;
    // Bar lines
    if (f.beatDur > 0) {
      const barDur = f.beatDur * f.beatsPerBar;
      for (let b = Math.ceil((f.time - 0.4) / barDur); b * barDur < f.time + span; b++) {
        if (b * barDur < f.beatStart) continue;
        const x = playX + (b * barDur - f.time) * spx;
        if (x < playX - 30) continue;
        c.fillStyle = 'rgba(43,38,85,0.35)';
        c.fillRect(x, bottomLine - gap * 4, 1, gap * 4);
      }
    }
    // Playhead
    c.fillStyle = 'rgba(255,77,109,0.85)';
    c.fillRect(playX - 1, bottomLine - gap * 5.5, 2, gap * 7);

    if (!f.notes || !f.states) return;
    for (const n of f.notes) {
      if (n.time > f.time + span) break;
      if (n.time < f.time - 0.4) continue;
      const x = playX + (n.time - f.time) * spx;
      if (x < 40) continue;
      const { step, sharp } = staffPosition(n.pitch);
      const y = stepY(step);
      const st = f.states[n.id];
      const done = !!st.grade;
      c.fillStyle = c.strokeStyle = done ? (st.grade === 'miss' ? '#ff6b81' : '#25b47e') : '#2b2655';
      // Ledger lines (C4 / B3 / A5…)
      c.lineWidth = 1;
      for (let s = 28; s >= step; s -= 2) {
        const ly = stepY(s);
        c.beginPath(); c.moveTo(x - gap * 1.1, ly); c.lineTo(x + gap * 1.1, ly); c.stroke();
      }
      for (let s = 40; s <= step; s += 2) {
        const ly = stepY(s);
        c.beginPath(); c.moveTo(x - gap * 1.1, ly); c.lineTo(x + gap * 1.1, ly); c.stroke();
      }
      const hollow = n.beats >= 2;
      c.beginPath();
      c.ellipse(x, y, gap * 0.68, gap * 0.48, -0.35, 0, Math.PI * 2);
      c.lineWidth = 1.6;
      if (hollow) c.stroke(); else c.fill();
      if (n.beats < 4) {
        const up = step < 34;
        c.fillRect(up ? x + gap * 0.6 : x - gap * 0.68, up ? y - gap * 3.3 : y, 1.4, gap * 3.3);
        if (n.beats <= 0.5) {
          const sy = up ? y - gap * 3.3 : y + gap * 3.3;
          const sx = up ? x + gap * 0.6 : x - gap * 0.68;
          c.beginPath();
          c.moveTo(sx, sy);
          c.quadraticCurveTo(sx + gap, sy + (up ? gap : -gap), sx + gap * 0.8, sy + (up ? gap * 2 : -gap * 2));
          c.stroke();
        }
      }
      if (sharp) {
        c.font = `700 ${gap * 1.6}px ${FONT}`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('♯', x - gap * 1.6, y);
      }
    }
  }

  private drawPopup(top: number, lineY: number, now: number): void {
    const p = this.popup;
    if (!p) return;
    const age = now - p.t0;
    if (age > 650) { this.popup = null; return; }
    const c = this.c;
    const scale = this.reducedMotion ? 1 : 1 + Math.max(0, 0.25 - age / 400);
    c.save();
    c.globalAlpha = Math.min(1, (650 - age) / 200);
    c.translate(this.w / 2, top + (lineY - top) * 0.42);
    c.scale(scale, scale);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `900 ${Math.min(44, this.w / 12)}px ${FONT}`;
    c.lineWidth = 6;
    c.strokeStyle = 'rgba(20,16,40,0.85)';
    c.strokeText(p.text, 0, 0);
    c.fillStyle = p.color;
    c.fillText(p.text, 0, 0);
    if (p.sub) {
      c.font = `800 ${Math.min(18, this.w / 30)}px ${FONT}`;
      c.strokeText(p.sub, 0, 32);
      c.fillStyle = '#ffffff';
      c.fillText(p.sub, 0, 32);
    }
    c.restore();
  }

  private drawBanner(text: string, top: number, lineY: number): void {
    const c = this.c;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `900 ${Math.min(72, this.w / 8)}px ${FONT}`;
    c.lineWidth = 8;
    c.strokeStyle = 'rgba(20,16,40,0.8)';
    const y = top + (lineY - top) * 0.3;
    c.strokeText(text, this.w / 2, y);
    c.fillStyle = '#ffffff';
    c.fillText(text, this.w / 2, y);
  }
}

