/**
 * דגלי תצורה גלובליים לאתר.
 *
 * CHECKOUT_ENABLED אוכף בקוד את שער 2 (docs/QUALITY-GATES.md): כל עוד סוכן 1
 * לא חתם על בדיקת העומס + חיבור התשלום ב-state/LOAD-TEST-LOG.md, הדגל הזה
 * false כברירת מחדל, וכל ה-CTA-ים באתר מפנים לרשימת המתנה (/waitlist)
 * ולא לצ'קאאוט אמיתי — גם אם מישהו ינסה לקשר ישירות ל-/checkout.
 *
 * להפעלה בפרודקשן אחרי חתימת שער 2: להגדיר PUBLIC_CHECKOUT_ENABLED=true
 * במשתני הסביבה של סביבת האירוח (לא כאן בקוד).
 */
export const CHECKOUT_ENABLED: boolean = import.meta.env.PUBLIC_CHECKOUT_ENABLED === "true";

export const PRODUCT = {
  name: "20 דקות הזהב",
  priceILS: 33,
  lessonsCount: 6,
};

export function ctaHref(): string {
  return CHECKOUT_ENABLED ? "/checkout" : "/waitlist";
}
