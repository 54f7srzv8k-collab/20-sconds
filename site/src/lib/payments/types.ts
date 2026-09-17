/**
 * Payment gateway abstraction — Wake Up ☕️
 *
 * מטרה: כל ספק תשלום (Grow / Cardcom / Meshulam / mock) מיישם את אותו
 * ה-interface. שאר הקוד (עמוד הצ'קאאוט, ה-API route, הניטור) מדבר רק מול
 * ה-interface הזה — אף פעם לא מול SDK של ספק ספציפי. החלפת ספק = כתיבת
 * providers/<name>.ts חדש, בלי לגעת בשאר המערכת.
 *
 * ראה docs/ARCHITECTURE.md § "שכבת הפשטת תשלומים" להסבר המלא ולהשוואת הספקים.
 */

export type Currency = "ILS";

export interface ChargeRequest {
  /** מזהה הזמנה פנימי שלנו (לא של הספק) — קבוע לכל ניסיון תשלום על אותה הזמנה */
  orderId: string;
  /**
   * מפתח אידמפוטנטיות — מיוצר פעם אחת בלחיצה על כפתור "קנה" (client side,
   * uuid), ונשלח עם כל ניסיון חוזר (double-click, retry אחרי timeout).
   * חובה שה-adapter לא יחייב פעמיים על אותו מפתח.
   */
  idempotencyKey: string;
  /** בסכום שלמים (אגורות) כדי להימנע משגיאות עיגול. 33 ₪ = 3300 */
  amountAgorot: number;
  currency: Currency;
  customer: {
    email?: string;
    phone?: string;
    fullName?: string;
  };
  /** לאן הספק מחזיר את הלקוח אחרי תשלום מוצלח / כושל (hosted checkout) */
  successUrl: string;
  failureUrl: string;
  /** מטא-דאטה חופשי לצורך התאמה מול לוח הבקרה של סוכן 9 */
  metadata?: Record<string, string>;
}

export type ChargeStatus =
  | "pending" // התחיל, ממתין לאישור אסינכרוני (webhook / redirect)
  | "approved"
  | "declined" // כרטיס נדחה
  | "timeout" // אין תשובה מהספק בזמן סביר
  | "error" // שגיאת מערכת/תקשורת
  | "duplicate_ignored"; // אותו idempotencyKey כבר טופל — לא חויב שוב

export interface ChargeResult {
  status: ChargeStatus;
  /** מזהה החיוב אצל הספק, לשימוש בבירורים/זיכויים */
  providerRef?: string;
  /** לספקים עם hosted checkout — לאן להפנות את הדפדפן להשלמת התשלום */
  redirectUrl?: string;
  errorCode?: string;
  errorMessage?: string;
  /** התשובה הגולמית מהספק, לצורך דיבוג/לוג — לא לחשוף ללקוח */
  raw?: unknown;
}

export interface WebhookEvent {
  type: "charge.approved" | "charge.declined" | "charge.refunded" | "charge.error";
  providerRef: string;
  orderId?: string;
  amountAgorot?: number;
  raw: unknown;
}

export interface RefundResult {
  ok: boolean;
  raw?: unknown;
}

export type ProviderName = "mock" | "grow" | "cardcom" | "meshulam";

export interface PaymentProvider {
  readonly name: ProviderName;
  /**
   * שמות משתני הסביבה שהספק הזה צריך כדי לעבוד באמת (מפתחות API, merchant id
   * וכו'). מתועד כאן כדי שברגע שחסם #2 ב-BLOCKERS.md נפתח, ברור בדיוק מה
   * להזין ואיפה — בלי לחפש בקוד.
   */
  readonly requiredEnv: string[];
  createCharge(req: ChargeRequest): Promise<ChargeResult>;
  /** מאמת חתימת webhook ומפרסר אותו לאירוע אחיד. מחזיר null אם החתימה לא תקינה. */
  verifyWebhook(headers: Record<string, string>, rawBody: string): WebhookEvent | null;
  getChargeStatus(providerRef: string): Promise<ChargeResult>;
  refund(providerRef: string, amountAgorot?: number): Promise<RefundResult>;
}

export class ProviderNotConfiguredError extends Error {
  constructor(provider: ProviderName, requiredEnv: string[]) {
    super(
      `ספק תשלום "${provider}" לא מחובר: חסרים משתני סביבה [${requiredEnv.join(", ")}]. ` +
        `זהו חסם #2 ב-docs/BLOCKERS.md — עובדים מול provider "mock" עד שהמפתחות יגיעו.`
    );
    this.name = "ProviderNotConfiguredError";
  }
}
