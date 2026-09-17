/**
 * בדיקה עצמית של שכבת התשלום מול MockPaymentProvider — לא מול ספק אמיתי
 * (חסום, BLOCKERS.md #2), ולא בדיקת עומס תשתית (זה scripts/local-load-test.ts).
 *
 * מטרה: לוודא שנתיבי הכשל שדורש docs/PROJECT-BRIEF.md ("כרטיס נדחה, timeout,
 * כפל-שליחה, ניתוק לקוח") מטופלים נכון ברמת הלוגיקה, לפני שיש בכלל ספק אמיתי
 * לבדוק מולו.
 *
 * הרצה: npm run test:payments
 */
import { MockPaymentProvider } from "../src/lib/payments/providers/mock.js";
import {
  InMemoryIdempotencyStore,
  withIdempotency,
  DUPLICATE_IN_PROGRESS,
} from "../src/lib/payments/idempotency.js";
import type { ChargeRequest, ChargeResult } from "../src/lib/payments/types.js";

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string) {
  if (cond) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.log(`  ❌ ${label}`);
  }
}

function baseRequest(overrides: Partial<ChargeRequest> = {}): ChargeRequest {
  return {
    orderId: `order_${Math.random()}`,
    idempotencyKey: `idem_${Math.random()}`,
    amountAgorot: 3300,
    currency: "ILS",
    customer: { fullName: "בדיקה", phone: "0500000001", email: "test@example.com" },
    successUrl: "/checkout/success",
    failureUrl: "/checkout",
    ...overrides,
  };
}

async function main() {
  const provider = new MockPaymentProvider();

  console.log("\n1. תשלום תקין → approved");
  const ok = await provider.createCharge(baseRequest());
  assert(ok.status === "approved", "status === approved");
  assert(!!ok.providerRef, "providerRef קיים");

  console.log("\n2. כרטיס נדחה (phone מסתיים ב-0000)");
  const declined = await provider.createCharge(
    baseRequest({ customer: { phone: "0500000000" } })
  );
  assert(declined.status === "declined", "status === declined");
  assert(!!declined.errorCode, "errorCode קיים כשיש דחייה");

  console.log("\n3. שגיאת מערכת אצל הספק (phone מסתיים ב-1111)");
  const errored = await provider.createCharge(baseRequest({ customer: { phone: "0501111111" } }));
  assert(errored.status === "error", "status === error");

  console.log("\n4. timeout מהספק (phone מסתיים ב-9999) — לא נתקע לנצח");
  const t0 = Date.now();
  const timedOut = await provider.createCharge(baseRequest({ customer: { phone: "0509999999" } }));
  const elapsed = Date.now() - t0;
  assert(timedOut.status === "timeout", "status === timeout");
  assert(elapsed < 10000, `זמן תגובה סביר גם ב-timeout (${elapsed}ms < 10s)`);

  console.log("\n5. אידמפוטנטיות — כפל-שליחה על אותו idempotencyKey לא מחייב פעמיים");
  const store = new InMemoryIdempotencyStore<ChargeResult>();
  const req = baseRequest();
  let chargeCallCount = 0;
  const chargeOnce = () => {
    chargeCallCount++;
    return provider.createCharge(req);
  };
  const [first, second] = await Promise.all([
    withIdempotency(store, req.idempotencyKey, chargeOnce),
    withIdempotency(store, req.idempotencyKey, chargeOnce),
  ]);
  // אחד מהשניים חייב להיות "מזוהה ככפול" (DUPLICATE_IN_PROGRESS) ולא לחייב שוב,
  // כי שתי הבקשות רצות ממש באותו זמן (מדמה double-click אמיתי).
  const oneWasDuplicate = first === DUPLICATE_IN_PROGRESS || second === DUPLICATE_IN_PROGRESS;
  assert(oneWasDuplicate, "בקשה כפולה בו-זמנית מזוהה ולא רצה פעמיים");
  assert(chargeCallCount === 1, `provider.createCharge נקרא פעם אחת בלבד (בפועל: ${chargeCallCount})`);

  console.log("\n6. אידמפוטנטיות — retry אחרי שהראשון כבר הסתיים מחזיר את אותה תוצאה");
  const store2 = new InMemoryIdempotencyStore<ChargeResult>();
  const req2 = baseRequest();
  const attempt1 = await withIdempotency(store2, req2.idempotencyKey, () =>
    provider.createCharge(req2)
  );
  const attempt2 = await withIdempotency(store2, req2.idempotencyKey, () =>
    provider.createCharge(req2)
  );
  assert(
    attempt1 !== DUPLICATE_IN_PROGRESS &&
      attempt2 !== DUPLICATE_IN_PROGRESS &&
      (attempt1 as ChargeResult).providerRef === (attempt2 as ChargeResult).providerRef,
    "retry אחרי סיום מחזיר את אותה תוצאה שמורה (לא חיוב חדש)"
  );

  console.log("\n7. webhook עם גוף לא תקין נדחה (לא סומכים על תוכן לא מאומת)");
  const badWebhook = provider.verifyWebhook({}, "not-json");
  assert(badWebhook === null, "webhook לא תקין מוחזר כ-null");

  console.log("\n8. refund על חיוב שלא אושר נכשל בבירור");
  const refundOnDeclined = await provider.refund(declined.providerRef ?? "missing");
  assert(refundOnDeclined.ok === false, "לא ניתן לזכות חיוב שלא אושר");

  console.log(`\n--- סיכום: ${passed} עברו, ${failed} נכשלו ---\n`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("שגיאה בהרצת הבדיקה:", err);
  process.exit(1);
});
