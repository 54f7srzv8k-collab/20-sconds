// Cloudflare Pages Function — POST /api/checkout/webhook
//
// כאן הספק (Grow/Cardcom/Meshulam/mock) מדווח על סטטוס תשלום אסינכרוני
// (למשל: לקוח שסגר את הדפדפן אחרי שהתחיל תשלום, וחוזר/לא חוזר — הספק עדיין
// שולח webhook כשההוראה מסתיימת). זה נתיב קריטי: בלי טיפול נכון בו, אפשר
// לפספס אישור תשלום שכן הצליח (=לקוח שילם ולא קיבל גישה לקורס) או להראות
// "אושר" כשלא היה תשלום אמיתי (=גישה בחינם/הונאה).
//
// חובה: כל בקשה עוברת verifyWebhook (חתימה) לפני שמאמינים לתוכן שלה.

import { getPaymentProvider } from "../../../src/lib/payments/adapter.js";

interface Env {
  PAYMENT_PROVIDER?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const rawBody = await context.request.text();
  const headers: Record<string, string> = {};
  context.request.headers.forEach((value, key) => (headers[key] = value));

  const provider = getPaymentProvider();
  const event = provider.verifyWebhook(headers, rawBody);

  if (!event) {
    // חתימה לא תקינה / גוף לא תקין — לא בהכרח תקיפה, יכול להיות גם באג
    // באינטגרציה. מחזירים 400 ולא סומכים על התוכן בשום מקרה.
    return new Response(JSON.stringify({ error: "invalid_webhook" }), { status: 400 });
  }

  // TODO(סוכן 9): לכל event.type (כולל declined/refunded/error) — לשלוח
  // מיד לצינור הניטור בזמן אמת + לעדכן את רשומת ההזמנה אצלנו.
  // TODO(סוכן 8): ב-charge.approved — להפעיל את מסלול מסירת הגישה לקורס.

  return new Response(JSON.stringify({ received: true, type: event.type }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
