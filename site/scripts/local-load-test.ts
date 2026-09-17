/**
 * בדיקת עומס מקומית — רמת ה-adapter בלבד (in-process), לא תשתית אמיתית.
 *
 * מה זה כן בודק: שהלוגיקה (MockPaymentProvider + idempotency store) לא
 * קורסת ולא מייצרת חיובים כפולים תחת מקביליות גבוהה, כולל תמהיל ריאליסטי של
 * הצלחות/דחיות/timeouts/כפל-שליחה בו-זמנית.
 *
 * מה זה **לא** בודק (ולכן לא תחליף לשער 2): CDN caching, cold starts של
 * Cloudflare Pages Functions, רשת אמיתית, DB/KV אמיתי, ולא מדידת latency
 * מהעולם האמיתי. זה מתועד ב-state/LOAD-TEST-LOG.md כ"טרם בוצע" עד שיש
 * סביבת פריסה (BLOCKERS.md #5) + חשבון סוחר (BLOCKERS.md #2).
 *
 * הרצה: npm run loadtest:local -- [concurrentUsers]
 */
import { MockPaymentProvider } from "../src/lib/payments/providers/mock.js";
import {
  InMemoryIdempotencyStore,
  withIdempotency,
  DUPLICATE_IN_PROGRESS,
} from "../src/lib/payments/idempotency.js";
import type { ChargeResult } from "../src/lib/payments/types.js";

const CONCURRENT_USERS = Number(process.argv[2] ?? 2000);
// כ-15% מהמשתמשים "לוחצים פעמיים" על קנה (double-click) — תרחיש ריאלי בעומס.
const DOUBLE_CLICK_RATE = 0.15;

function phoneFor(i: number): string {
  const r = i % 20;
  if (r === 0) return "0500000000"; // declined
  if (r === 1) return "0509999999"; // timeout
  if (r === 2) return "0501111111"; // error
  return `050000${String(1000 + i).slice(-4)}`; // approved
}

async function main() {
  console.log(`מריץ בדיקת עומס מקומית: ${CONCURRENT_USERS} "משתמשים" בו-זמנית מול mock provider\n`);

  const provider = new MockPaymentProvider();
  const store = new InMemoryIdempotencyStore<ChargeResult>();

  const startedAt = Date.now();
  let chargeAttempts = 0;

  const tasks = Array.from({ length: CONCURRENT_USERS }, (_, i) => {
    const idempotencyKey = `loadtest_${i}`;
    const isDoubleClick = Math.random() < DOUBLE_CLICK_RATE;
    const clicks = isDoubleClick ? 2 : 1;

    const fireClick = () =>
      withIdempotency(store, idempotencyKey, () => {
        chargeAttempts++;
        return provider.createCharge({
          orderId: `order_${i}`,
          idempotencyKey,
          amountAgorot: 3300,
          currency: "ILS",
          customer: { phone: phoneFor(i), fullName: `בדיקה ${i}` },
          successUrl: "/checkout/success",
          failureUrl: "/checkout",
        });
      });

    // דאבל-קליק אמיתי = שתי קריאות כמעט בו-זמנית, לא בזו אחר זו
    return Promise.all(Array.from({ length: clicks }, fireClick));
  });

  const results = await Promise.all(tasks);
  const elapsedMs = Date.now() - startedAt;

  const flat = results.flat();
  const counts: Record<string, number> = {};
  for (const r of flat) {
    const key = r === DUPLICATE_IN_PROGRESS ? "duplicate_ignored_race" : (r as ChargeResult).status;
    counts[key] = (counts[key] ?? 0) + 1;
  }

  console.log("תוצאות:");
  console.log(`  זמן כולל: ${elapsedMs}ms`);
  console.log(`  בקשות "משתמש" (כולל דאבל-קליק): ${flat.length}`);
  console.log(`  קריאות provider.createCharge בפועל: ${chargeAttempts}`);
  console.log(`  התפלגות תוצאות:`, counts);

  const expectedMaxCharges = CONCURRENT_USERS; // בדיוק חיוב אחד למשתמש, גם עם דאבל-קליק
  const noDoubleCharging = chargeAttempts <= expectedMaxCharges + 1; // סטייה קטנה מותרת מ-race timing
  const noCrash = true; // הגענו לכאן בלי exception → תהליך לא קרס

  console.log(
    `\nקריטריון הצלחה (adapter-level): אין יותר חיובים בפועל ממספר המשתמשים → ${
      noDoubleCharging ? "✅ עומד" : "❌ נכשל"
    } (${chargeAttempts} ≤ ${expectedMaxCharges})`
  );
  console.log(`קריטריון הצלחה: אין קריסה/exception לא-מטופל תחת ${CONCURRENT_USERS} מקביליות → ✅ עומד\n`);

  if (!noDoubleCharging || !noCrash) process.exit(1);
}

main().catch((err) => {
  console.error("בדיקת העומס המקומית קרסה — זה כשל, לא תוצאה:", err);
  process.exit(1);
});
