// Piano key geometry. The piano keyboard *is* the lane layout: falling notes use exactly
// these rectangles horizontally, so every note lines up with its key.
import { cAtOrBelow, isBlack, whiteAtOrAbove } from '../core/music';

export interface KeyRect { midi: number; x: number; w: number; black: boolean }

/** Black-key centre offsets (fraction of a white key) relative to the boundary they sit on. */
const BLACK_SHIFT: Record<number, number> = { 1: -0.08, 3: 0.08, 6: -0.1, 8: 0, 10: 0.1 };

export function pianoLayout(lo: number, hi: number, width: number, x0 = 0): KeyRect[] {
  const whites: number[] = [];
  for (let m = lo; m <= hi; m++) if (!isBlack(m)) whites.push(m);
  const ww = width / whites.length;
  const bw = ww * 0.62;
  const rects: KeyRect[] = [];
  whites.forEach((m, i) => rects.push({ midi: m, x: x0 + i * ww, w: ww, black: false }));
  for (let m = lo; m <= hi; m++) {
    if (!isBlack(m)) continue;
    const leftWhite = whites.indexOf(m - 1);
    if (leftWhite < 0) continue;
    const cx = x0 + (leftWhite + 1) * ww + (BLACK_SHIFT[m % 12] ?? 0) * ww;
    rects.push({ midi: m, x: cx - bw / 2, w: bw, black: true });
  }
  return rects;
}

/** Display range for a song: whole octaves from C, always showing at least C4–E5. */
export function rangeFor(pitches: number[]): { lo: number; hi: number } {
  const min = Math.min(60, ...pitches);
  const max = Math.max(76, ...pitches);
  return { lo: cAtOrBelow(min), hi: whiteAtOrAbove(max) };
}
