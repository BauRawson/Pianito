// Progress tracking: stars, grades, best scores and lesson completion, persisted locally.

export interface KV {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** localStorage if usable (it can throw in private modes / sandboxed iframes), else null. */
export function safeStorage(): KV | null {
  try {
    const s = globalThis.localStorage;
    const probe = '__pianito_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

export const STAR_THRESHOLDS = [0.6, 0.8, 0.93] as const;

export function starsFor(accuracy: number): number {
  return STAR_THRESHOLDS.filter((t) => accuracy >= t - 1e-9).length;
}

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D';
export function gradeFor(accuracy: number): Grade {
  if (accuracy >= 0.97) return 'S';
  if (accuracy >= 0.9) return 'A';
  if (accuracy >= 0.8) return 'B';
  if (accuracy >= 0.6) return 'C';
  return 'D';
}

/** A lesson counts as completed with at least one star. */
export const isPassing = (accuracy: number): boolean => starsFor(accuracy) >= 1;

export interface SongRecord {
  bestScore: number;
  bestAccuracy: number;
  stars: number;
  maxCombo: number;
  plays: number;
  completed: boolean;
  lastPlayed: number;
}

interface ProgressData {
  version: 1;
  records: Record<string, SongRecord>;
  tutorialSeen: boolean;
}

export interface RecordOutcome {
  record: SongRecord;
  stars: number;
  newBest: boolean;
  firstClear: boolean;
}

const KEY = 'pianito.progress.v1';

export class Progress {
  private data: ProgressData;

  constructor(private store: KV | null, private now: () => number = Date.now) {
    this.data = { version: 1, records: {}, tutorialSeen: false };
    try {
      const raw = store?.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ProgressData>;
        if (parsed && parsed.version === 1) {
          this.data.records = parsed.records ?? {};
          this.data.tutorialSeen = !!parsed.tutorialSeen;
        }
      }
    } catch {
      /* corrupt data: start fresh */
    }
  }

  record(id: string, result: { score: number; accuracy: number; maxCombo: number }): RecordOutcome {
    const prev = this.data.records[id];
    const stars = starsFor(result.accuracy);
    const passed = stars >= 1;
    const newBest = !prev || result.score > prev.bestScore;
    const record: SongRecord = {
      bestScore: Math.max(prev?.bestScore ?? 0, result.score),
      bestAccuracy: Math.max(prev?.bestAccuracy ?? 0, result.accuracy),
      stars: Math.max(prev?.stars ?? 0, stars),
      maxCombo: Math.max(prev?.maxCombo ?? 0, result.maxCombo),
      plays: (prev?.plays ?? 0) + 1,
      completed: (prev?.completed ?? false) || passed,
      lastPlayed: this.now(),
    };
    this.data.records[id] = record;
    this.save();
    return { record, stars, newBest, firstClear: passed && !prev?.completed };
  }

  get(id: string): SongRecord | undefined { return this.data.records[id]; }
  isCompleted(id: string): boolean { return !!this.data.records[id]?.completed; }
  stars(id: string): number { return this.data.records[id]?.stars ?? 0; }
  totalStars(ids: string[]): number { return ids.reduce((s, id) => s + this.stars(id), 0); }
  completedCount(ids: string[]): number { return ids.filter((id) => this.isCompleted(id)).length; }

  /** The first lesson (in order) not yet completed, or undefined when all are done. */
  nextLesson(orderedIds: string[]): string | undefined {
    return orderedIds.find((id) => !this.isCompleted(id));
  }

  get tutorialSeen(): boolean { return this.data.tutorialSeen; }
  set tutorialSeen(v: boolean) { this.data.tutorialSeen = v; this.save(); }

  reset(): void {
    this.data = { version: 1, records: {}, tutorialSeen: false };
    this.save();
  }

  private save(): void {
    try { this.store?.setItem(KEY, JSON.stringify(this.data)); } catch { /* quota/private mode */ }
  }
}
