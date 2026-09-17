import type {
  ChargeRequest,
  ChargeResult,
  PaymentProvider,
  RefundResult,
  WebhookEvent,
} from "../types.js";
import { ProviderNotConfiguredError } from "../types.js";

/**
 * Cardcom — אלטרנטיבה לקנה מידה/עמלות נמוכות יותר בנפח גבוה (ראה
 * docs/ARCHITECTURE.md § השוואת ספקים). דורש חשבון סוחר בנקאי קיים, ולכן
 * זמן אינטגרציה ארוך יותר מ-Grow — מתועד כאן ל"מוכן להתחבר" בעתיד.
 *
 * חסום לביצוע בפועל עד לפתיחת חשבון סוחר (docs/BLOCKERS.md #2).
 */
export class CardcomPaymentProvider implements PaymentProvider {
  readonly name = "cardcom" as const;
  readonly requiredEnv = [
    "CARDCOM_TERMINAL_NUMBER",
    "CARDCOM_API_NAME",
    "CARDCOM_API_PASSWORD",
  ];

  private assertConfigured(): void {
    const missing = this.requiredEnv.filter((k) => !process.env[k]);
    if (missing.length > 0) {
      throw new ProviderNotConfiguredError(this.name, missing);
    }
  }

  async createCharge(_req: ChargeRequest): Promise<ChargeResult> {
    this.assertConfigured();
    // TODO(blocked on merchant account): קריאה אמיתית ל-Cardcom LowProfile API.
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
