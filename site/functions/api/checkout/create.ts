// Cloudflare Pages Function — POST /api/checkout/create
//
// זו נקודת הכניסה היחידה שמבצעת חיוב אמיתי. היא רצה **מבודדת** מדף המכירה
// הסטטי: דף המכירה מוגש כולו מה-CDN (קבצים סטטיים, אין להם תלות ב-function
// הזו), כך שגם אם יש עומס קיצוני על הצפיות בדף המכירה, זה לא פוגע ביכולת
// הפונקציה הזו לשרת בקשות תשלום, ולהפך: תקלה כאן לא מפילה את דף המכירה.
//
// ראה docs/ARCHITECTURE.md § "בידוד checkout מדף השיווק".
//
// הערה: תיקיית functions/ היא מוסכמת Cloudflare Pages Functions (file-based
// routing). אם בסוף נבחר אירוח אחר (Vercel/Netlify) — הלוגיקה בפועל יושבת
// כולה ב-src/lib/payments ולא כאן, כך שההעברה היא רק "עטיפה" דקה מחדש.

import { getPaymentProvider } from "../../../src/lib/payments/adapter.js";
import {
  InMemoryIdempotencyStore,
  withIdempotency,
  DUPLICATE_IN_PROGRESS,
} from "../../../src/lib/payments/idempotency.js";
import type { ChargeRequest, ChargeResult } from "../../../src/lib/payments/types.js";

// TODO(production): להחליף ב-Cloudflare KV / Durable Object — Map בזיכרון
// לא משותף בין edge instances שונים. ראה idempotency.ts.
const idempotencyStore = new InMemoryIdempotencyStore<ChargeResult>();

interface Env {
  PAYMENT_PROVIDER?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: Partial<ChargeRequest>;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  if (!body.orderId || !body.idempotencyKey || !body.amountAgorot || !body.customer) {
    return json({ error: "missing_fields" }, 400);
  }

  const chargeRequest: ChargeRequest = {
    orderId: body.orderId,
    idempotencyKey: body.idempotencyKey,
    amountAgorot: body.amountAgorot,
    currency: "ILS",
    customer: body.customer,
    successUrl: body.successUrl ?? "/checkout/success",
    failureUrl: body.failureUrl ?? "/checkout",
    metadata: body.metadata,
  };

  try {
    const provider = getPaymentProvider();
    const result = await withIdempotency(idempotencyStore, chargeRequest.idempotencyKey, () =>
      provider.createCharge(chargeRequest)
    );

    if (result === DUPLICATE_IN_PROGRESS) {
      // בקשה כפולה ממש תוך כדי עיבוד (double-click) — לא פותחים חיוב שני,
      // עונים ללקוח שהבקשה כבר בטיפול.
      return json({ status: "duplicate_ignored" }, 202);
    }

    // TODO(סוכן 9): לשגר אירוע charge.<status> לצינור הניטור בזמן אמת כאן,
    // כולל declined/timeout/error — לא רק approved. ראה docs/ARCHITECTURE.md
    // § "ניטור שגיאות תשלום בזמן אמת".

    const httpStatus = result.status === "approved" ? 200 : 402;
    return json(result, httpStatus);
  } catch (err) {
    // ProviderNotConfiguredError נופל לכאן כשמנסים ספק אמיתי בלי מפתחות —
    // זה חסם ידוע (#2), לא תקלה סמויה.
    const message = err instanceof Error ? err.message : "unknown_error";
    return json({ status: "error", errorMessage: message }, 500);
  }
};

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
