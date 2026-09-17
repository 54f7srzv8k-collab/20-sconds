import type { PaymentProvider, ProviderName } from "./types.js";
import { MockPaymentProvider } from "./providers/mock.js";
import { GrowPaymentProvider } from "./providers/grow.js";
import { CardcomPaymentProvider } from "./providers/cardcom.js";
import { MeshulamPaymentProvider } from "./providers/meshulam.js";

/**
 * נקודת הכניסה היחידה לבחירת ספק תשלום בכל שאר הקוד.
 *
 * שימוש: `const provider = getPaymentProvider();`
 * הבחירה נקבעת ע"י משתנה הסביבה PAYMENT_PROVIDER. ברירת המחדל היא "mock"
 * כל עוד לא הוגדר אחרת — כלומר בלי משתני סביבה, המערכת עובדת מול sandbox
 * מדומה ולא נופלת. זה בכוונה: BLOCKERS.md #2 לא אמור לעצור פיתוח.
 *
 * החלפת ספק תשלום אמיתי (Grow → Cardcom וכו') = שינוי משתנה סביבה אחד,
 * לא שכתוב קוד.
 */
export function getPaymentProvider(name?: ProviderName): PaymentProvider {
  const selected = name ?? (process.env.PAYMENT_PROVIDER as ProviderName | undefined) ?? "mock";

  switch (selected) {
    case "mock":
      return new MockPaymentProvider();
    case "grow":
      return new GrowPaymentProvider();
    case "cardcom":
      return new CardcomPaymentProvider();
    case "meshulam":
      return new MeshulamPaymentProvider();
    default: {
      const exhaustiveCheck: never = selected;
      throw new Error(`ספק תשלום לא מוכר: ${exhaustiveCheck}`);
    }
  }
}

export * from "./types.js";
export { InMemoryIdempotencyStore, withIdempotency, DUPLICATE_IN_PROGRESS } from "./idempotency.js";
