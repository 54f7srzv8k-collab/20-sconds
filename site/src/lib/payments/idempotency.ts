/**
 * שכבת אידמפוטנטיות לכפתור "קנה".
 *
 * בעומס גבוה ובמובייל עם רשת רעה, לקוחות לוחצים פעמיים על "קנה", או מאבדים
 * חיבור ומרעננים/חוזרים. בלי הגנה כאן — חיוב כפול אמיתי בכרטיס אשראי.
 *
 * המימוש כאן הוא in-memory (Map) — טוב ל-dev/mock ולבדיקות עצמיות, אבל
 * *לא* מספיק לפרודקשן עם יותר מ-instance אחד (Cloudflare Pages Functions
 * רץ על אדג'ים מרובים, כל אחד עם זיכרון נפרד). לפני שער 2 בסביבת פרודקשן
 * אמיתית יש להחליף את המחלקה הזו במימוש מבוסס Cloudflare KV / Durable Object
 * (ראה TODO בהמשך הקובץ ובדיווח ב-docs/ARCHITECTURE.md).
 */

export type IdempotencyStatus = "in_progress" | "done";

export interface IdempotencyRecord<T> {
  status: IdempotencyStatus;
  result?: T;
  startedAt: number;
}

export interface IdempotencyStore<T> {
  get(key: string): IdempotencyRecord<T> | undefined;
  setInProgress(key: string): void;
  setDone(key: string, result: T): void;
}

/** מימוש in-memory. TODO(production): להחליף ל-Cloudflare KV / Durable Object / Redis. */
export class InMemoryIdempotencyStore<T> implements IdempotencyStore<T> {
  private map = new Map<string, IdempotencyRecord<T>>();
  private ttlMs: number;

  constructor(ttlMs = 1000 * 60 * 30) {
    this.ttlMs = ttlMs;
  }

  get(key: string): IdempotencyRecord<T> | undefined {
    const rec = this.map.get(key);
    if (rec && Date.now() - rec.startedAt > this.ttlMs) {
      this.map.delete(key);
      return undefined;
    }
    return rec;
  }

  setInProgress(key: string): void {
    this.map.set(key, { status: "in_progress", startedAt: Date.now() });
  }

  setDone(key: string, result: T): void {
    const existing = this.map.get(key);
    this.map.set(key, {
      status: "done",
      result,
      startedAt: existing?.startedAt ?? Date.now(),
    });
  }

  /** לבדיקות בלבד */
  size(): number {
    return this.map.size;
  }
}

export const DUPLICATE_IN_PROGRESS = Symbol("duplicate_in_progress");

/**
 * מריץ פעולה בגדר אידמפוטנטית לפי מפתח.
 * - אם המפתח כבר "done" — מחזיר את התוצאה השמורה בלי להריץ שוב (אין חיוב כפול).
 * - אם המפתח "in_progress" (בקשה מקבילה עדיין רצה, למשל double-click ממש
 *   באותה שנייה) — מחזיר DUPLICATE_IN_PROGRESS כדי שהקורא יגיב בלי לפתוח
 *   חיוב שני.
 * - אחרת מריץ את fn, שומר את התוצאה, ומחזיר אותה.
 */
export async function withIdempotency<T>(
  store: IdempotencyStore<T>,
  key: string,
  fn: () => Promise<T>
): Promise<T | typeof DUPLICATE_IN_PROGRESS> {
  const existing = store.get(key);
  if (existing?.status === "done" && existing.result !== undefined) {
    return existing.result;
  }
  if (existing?.status === "in_progress") {
    return DUPLICATE_IN_PROGRESS;
  }
  store.setInProgress(key);
  const result = await fn();
  store.setDone(key, result);
  return result;
}
