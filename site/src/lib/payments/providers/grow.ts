import type {
  ChargeRequest,
  ChargeResult,
  PaymentProvider,
  RefundResult,
  WebhookEvent,
} from "../types.js";
import { ProviderNotConfiguredError } from "../types.js";

/**
 * Grow — ספק תשלום מומלץ (ראה docs/ARCHITECTURE.md § השוואת ספקים).
 *
 * חסום לביצוע בפועל עד לפתיחת חשבון סוחר (docs/BLOCKERS.md #2).
 * כשהחשבון ייפתח, למלא כאן:
 *   - קריאת API אמיתית ל-Grow (hosted checkout page / iframe) ב-createCharge
 *   - אימות חתימת webhook לפי המפתח הסודי של Grow ב-verifyWebhook
 * המשתנים הנדרשים מתועדים ב-requiredEnv כך שברגע שהם קיימים ב-.env,
 * אפשר להסיר את הזריקה למטה ולחבר קריאה אמיתית בלי לשנות שום קוד קורא.
 */
export class GrowPaymentProvider implements PaymentProvider {
  readonly name = "grow" as const;
  readonly requiredEnv = [
    "GROW_API_KEY",
    "GROW_TERMINAL_ID", // מזהה המסוף/העסק ב-Grow
    "GROW_WEBHOOK_SECRET", // לאימות חתימת ה-webhook שחוזר מ-Grow
  ];

  private assertConfigured(): void {
    const missing = this.requiredEnv.filter((k) => !process.env[k]);
    if (missing.length > 0) {
      throw new ProviderNotConfiguredError(this.name, missing);
    }
  }

  async createCharge(_req: ChargeRequest): Promise<ChargeResult> {
    this.assertConfigured();
    // TODO(blocked on merchant account): קריאה אמיתית ל-Grow Checkout API.
    throw new ProviderNotConfiguredError(this.name, this.requiredEnv);
  }

  verifyWebhook(_headers: Record<string, string>, _rawBody: string): WebhookEvent | null {
    this.assertConfigured();
    // TODO: אימות חתימת webhook לפי מסמכי Grow.
    return null;
  }

  async getChargeStatus(_providerRef: string): Promise<ChargeResult> {
    this.assertConfigured();
    throw new ProviderNotConfiguredError(this.name, this.requiredEnv);
  }

  async refund(_providerRef: string, _amountAgorot?: number): Promise<RefundResult> {
    this.assertConfigured();
    throw new ProviderNotConfiguredError(this.name, this.requiredEnv);
  }
}
