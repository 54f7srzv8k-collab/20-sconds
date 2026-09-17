import type {
  ChargeRequest,
  ChargeResult,
  PaymentProvider,
  RefundResult,
  WebhookEvent,
} from "../types.js";
import { ProviderNotConfiguredError } from "../types.js";

/**
 * Meshulam ("משולם") — אלטרנטיבה שלישית (ראה docs/ARCHITECTURE.md § השוואת
 * ספקים). נשמרת כאן כדי שהחלטה על שינוי ספק לא תדרוש שכתוב — רק מימוש
 * המחלקה הזו ובחירתה ב-adapter.ts.
 *
 * חסום לביצוע בפועל עד לפתיחת חשבון סוחר (docs/BLOCKERS.md #2).
 */
export class MeshulamPaymentProvider implements PaymentProvider {
  readonly name = "meshulam" as const;
  readonly requiredEnv = ["MESHULAM_USER_ID", "MESHULAM_API_KEY", "MESHULAM_PAGE_CODE"];

  private assertConfigured(): void {
    const missing = this.requiredEnv.filter((k) => !process.env[k]);
    if (missing.length > 0) {
      throw new ProviderNotConfiguredError(this.name, missing);
    }
  }

  async createCharge(_req: ChargeRequest): Promise<ChargeResult> {
    this.assertConfigured();
    // TODO(blocked on merchant account): קריאה אמיתית ל-Meshulam API.
    throw new ProviderNotConfiguredError(this.name, this.requiredEnv);
  }

  verifyWebhook(_headers: Record<string, string>, _rawBody: string): WebhookEvent | null {
    this.assertConfigured();
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
