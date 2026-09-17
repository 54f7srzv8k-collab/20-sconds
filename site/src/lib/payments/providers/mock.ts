import type {
  ChargeRequest,
  ChargeResult,
  PaymentProvider,
  RefundResult,
  WebhookEvent,
} from "../types.js";

/**
 * ספק מדומה (mock) — לשימוש עד שחשבון סוחר אמיתי מחובר (BLOCKERS.md #2),
 * ולבדיקות עצמיות/עומס לוגיקת ה-checkout בלי לגעת בכסף אמיתי.
 *
 * מדמה תרחישי כשל אמיתיים לפי amountAgorot / phone מיוחדים, כדי שאפשר
 * לבדוק את כל הנתיבים (אישור, דחייה, timeout, שגיאת מערכת) בלי ספק אמיתי:
 *   - phone מסתיים ב-"0000" → דחיית כרטיס (declined)
 *   - phone מסתיים ב-"9999" → timeout מדומה (מעל 5 שניות ואז נכשל)
 *   - phone מסתיים ב-"1111" → שגיאת מערכת (error)
 *   - כל השאר → אישור (approved) אחרי השהיה קצרה מדומה
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock" as const;
  readonly requiredEnv: string[] = []; // אין צורך במפתחות — זה מה שהופך אותו לזמין תמיד

  private charges = new Map<string, ChargeResult & { orderId: string }>();

  async createCharge(req: ChargeRequest): Promise<ChargeResult> {
    const phone = req.customer.phone ?? "";
    const providerRef = `mock_${req.idempotencyKey}`;

    // מדמה latency רשת אמיתית (חשוב לבדיקת עומס/timeout)
    await sleep(50 + Math.random() * 150);

    let result: ChargeResult;
    if (phone.endsWith("0000")) {
      result = {
        status: "declined",
        providerRef,
        errorCode: "card_declined",
        errorMessage: "כרטיס האשראי נדחה על ידי הסולק (מדומה)",
      };
    } else if (phone.endsWith("9999")) {
      await sleep(5000);
      result = {
        status: "timeout",
        providerRef,
        errorCode: "gateway_timeout",
        errorMessage: "הספק לא הגיב בזמן (מדומה)",
      };
    } else if (phone.endsWith("1111")) {
      result = {
        status: "error",
        providerRef,
        errorCode: "internal_error",
        errorMessage: "שגיאת מערכת אצל הספק (מדומה)",
      };
    } else {
      result = { status: "approved", providerRef };
    }

    this.charges.set(providerRef, { ...result, orderId: req.orderId });
    return result;
  }

  verifyWebhook(_headers: Record<string, string>, rawBody: string): WebhookEvent | null {
    try {
      const parsed = JSON.parse(rawBody);
      if (!parsed?.providerRef) return null;
      return {
        type: parsed.type ?? "charge.approved",
        providerRef: parsed.providerRef,
        orderId: parsed.orderId,
        amountAgorot: parsed.amountAgorot,
        raw: parsed,
      };
    } catch {
      return null;
    }
  }

  async getChargeStatus(providerRef: string): Promise<ChargeResult> {
    const found = this.charges.get(providerRef);
    if (!found) {
      return { status: "error", errorCode: "not_found", errorMessage: "חיוב לא נמצא" };
    }
    return found;
  }

  async refund(providerRef: string): Promise<RefundResult> {
    const found = this.charges.get(providerRef);
    if (!found || found.status !== "approved") {
      return { ok: false };
    }
    return { ok: true };
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
