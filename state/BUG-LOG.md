# יומן באגים — QA קצה-לקצה (סוכן 11)

> נכתב ע"י `qa-e2e-lead`. מבוסס על הרצה בפועל (`npm install && npm run build &&
> npm run test:payments && npm run loadtest:local` בתוך `site/`, 2026-09-17) +
> קריאת קוד בעיון של כל `site/src` ו-`site/functions`, מול `docs/PROJECT-BRIEF.md`,
> `docs/ARCHITECTURE.md`, `docs/ACCESSIBILITY-CHECKLIST.md` ו-`legal/*.md`.
>
> זהו בדיקת **מסלולים חלקיים מוקדם** לפי הגדרת התפקיד — לא שער 5 מלא. חלק
> מהממצאים כאן חוסמים רק מהרגע שמסלול מסוים בפועל יופעל (למשל checkout אמיתי),
> לא בהכרח היום כש-`CHECKOUT_ENABLED=false`.
>
> **מקרא חומרה:** 🔴 חוסם (must-fix לפני שער רלוונטי) | 🟡 לא-חוסם (לתקן, מתועד לגיבוי) | ⚪ לא ניתן לבדיקה עדיין (רכיב לא קיים)

---

## 🔴 חוסמים (5/5 תוקנו ע"י `site-payments-lead`, 2026-09-17)

> **עדכון סוכן 1 (2026-09-17):** תוקנו כל 5 החוסמים שסוכן 11 מצא (BUG-01 עד
> BUG-05). לאחר כל תיקון הורצו `npm run build`, `npm run test:payments`
> (12/12 עברו) ו-`npx tsc --noEmit` בתוך `site/` — כולם ירוקים, שום דבר לא
> נשבר. התיקונים הם בעץ העבודה (לא קומיטו) — קבצים שהשתנו:
> `site/src/pages/checkout/index.astro`, `site/src/pages/checkout/success.astro`,
> `site/src/pages/index.astro`, `site/src/layouts/BaseLayout.astro`.
> פרטי תיקון מלאים בכל סעיף למטה.

### BUG-01 — רענון דף באמצע תשלום מאפס את הגנת האידמפוטנטיות — ✅ תוקן
- **מיקום:** `site/src/pages/checkout/index.astro` שורות 51-53.
- **תיאור:** `idempotencyKey` (וממנו `orderId`) נוצר פעם אחת **בטעינת הסקריפט**
  (`crypto.randomUUID()`), לא נשמר ב-`sessionStorage`/`localStorage`. אם
  הלקוחה לוחצת "שלם/י", הבקשה יוצאת לרשת, ולפני שהתשובה חוזרת היא **מרעננת
  את הדף** (בדיוק תרחיש הכשל הנדרש ב-`docs/PROJECT-BRIEF.md` ובהגדרת התפקיד
  של סוכן 11: "רענון דף באמצע צ'קאאוט") — טעינת העמוד מחדש מייצרת
  `idempotencyKey`/`orderId` **חדשים לגמרי**. אם הבקשה הראשונה בפועל הצליחה
  אצל הספק (או עדיין בטיפול), ולקוחה לוחצת "שלם/י" שוב אחרי הרענון, הבקשה
  השנייה **אינה מזוהה כלל** ע"י `withIdempotency()` כקשורה לראשונה (מפתח שונה)
  → סיכון ממשי לחיוב כפול אמיתי בכרטיס אשראי, בדיוק המצב שה-idempotency
  layer אמור למנוע.
- **חשוב להבחין:** ניתוק-רשת/timeout **בלי** רענון דף כן מטופל נכון — ה-`catch`
  משאיר את אותו `idempotencyKey` (המשתנה נשאר בזיכרון), כך שלחיצה חוזרת על
  אותו טעינת-עמוד מוגנת. הפער הוא ספציפית ל-**רענון/חזרה לעמוד** (כולל אם
  הדפדפן נסגר וסטטוס נבדק שוב או המשתמשת חוזרת אליו).
- **למה זה לא נתפס בבדיקות הקיימות:** גם `npm run test:payments` וגם
  `npm run loadtest:local` בודקים דאבל-קליק/retry עם **אותו** מפתח אידמפוטנטיות
  שנוצר פעם אחת בקוד הבדיקה עצמו — אף אחד מהם לא מדמה "טעינת עמוד חדשה" עם
  מפתח חדש על אותה הזמנה בפועל, ולכן שני הריצות שביצעתי עברו ✅ בלי לחשוף את
  הפער הזה.
- **שיוך:** סוכן 1 (`site-payments-lead`) — תיקון מוצע: לשמור את
  `idempotencyKey`/`orderId` ב-`sessionStorage` (מפתוח ל-orderId קיים אם יש,
  לא חדש בכל טעינה), ולשקול גם `orderId` נגזר משדות טופס יציבים (למשל hash
  של email+timestamp מגובה) כדי ש-refresh לא "יאבד" את ההזמנה.
- **חוסם:** שער 2 המלא (עומס+תשלום מול ספק אמיתי) ושער 5. לא חוסם כרגע כי
  `CHECKOUT_ENABLED=false` וממילא אין תשלום אמיתי באוויר.
- **תיקון בפועל:** `site/src/pages/checkout/index.astro` — הוצאה פונקציה
  `loadOrCreateOrder()` שקוראת `idempotencyKey`/`orderId` מ-`sessionStorage`
  (מפתח `wakeup_checkout_order_v1`) אם קיימים, ורק אם אין רשומה שמורה יוצרת
  מפתח חדש ושומרת אותו מיד. כך רענון דף (או חזרה אליו באותו טאב) טוען את
  אותה הזמנה קיימת במקום ליצור חדשה. בהצלחת תשלום (`status === "approved"`)
  נקראת `clearOrder()` שמנקה את הרשומה מ-`sessionStorage`, כך שרכישה הבאה
  (בטאב אחר/מאוחר יותר) מתחילה במפתח חדש. כל הגישה עטופה ב-`try/catch` כדי
  לא לשבור את הדף בדפדפנים/מצבים שחוסמים `sessionStorage` (fallback: מפתח
  בזיכרון בלבד, כמו קודם).

### BUG-02 — אין טיפול UI במצב `pending`/`redirectUrl` (hosted checkout) — יישבר מול כל ספק אמיתי — ✅ תוקן
- **מיקום:** `site/src/pages/checkout/index.astro` שורות 84-97 (טיפול בתוצאה);
  `site/src/lib/payments/types.ts` שורות 38-56 (`ChargeStatus`, `redirectUrl`).
- **תיאור:** ה-type `ChargeResult` תומך במפורש בסטטוס `"pending"` +
  `redirectUrl` בדיוק בשביל ספקי hosted-checkout/iframe (התיעוד ב-
  `types.ts` שורה 31 אומר זאת במפורש: "לספקים עם hosted checkout — לאן להפנות
  את הדפדפן"). שלושת הספקים המתועדים כמועמדים בפועל (Grow/Cardcom/Meshulam)
  הם כולם מבוססי redirect/hosted-page ב-Israel. אבל קוד הלקוח ב-
  `checkout/index.astro` בודק רק `approved`/`declined`/`timeout`/
  `duplicate_ignored`, ולכל תוצאה אחרת (כולל `pending`) נופל ל-else הגנרי
  "משהו השתבש. נסי שוב בעוד רגע." — **בלי להפנות בכלל ל-`result.redirectUrl`**.
  כלומר: ברגע שחסם #2 (`docs/BLOCKERS.md`) ייפתר ויחובר ספק אמיתי, מסלול
  התשלום החיובי כפי שהוא כתוב היום **ישבר** עבור כל ספק שמחזיר `pending`
  (רוב הסבירות לכל שלושת המועמדים).
- **שיוך:** סוכן 1. יש לטפל לפני חיבור ספק אמיתי בפועל, גם אם זה עצמו לא
  יקרה לפני חסם #2.
- **חוסם:** שער 2 המלא, לא חוסם היום (mock provider תמיד מחזיר סטטוס סופי,
  לא pending — ולכן גם `test:payments`/`loadtest:local` לא חושפים את זה).
- **תיקון בפועל:** `site/src/pages/checkout/index.astro` — נוסף ענף מפורש
  לפני הבדיקות הגנריות: אם `result.status === "pending"` וקיים
  `result.redirectUrl`, מוצגת הודעת סטטוס ("מעבירים אותך להשלמת התשלום אצל
  ספק הסליקה...") והדפדפן מופנה ל-`result.redirectUrl` (`window.location.href
  = result.redirectUrl`). נוסף גם fallback טקסטואלי ל-`pending` בלי
  `redirectUrl` (מקרה קצה תיאורטי) כדי שלא ייפול לשגיאת "משהו השתבש" הגנרית
  והמטעה. עדיין אין דרך להריץ E2E אמיתי מול ספק שמחזיר `pending` בפועל
  (mock תמיד מחזיר סטטוס סופי — ראה BUG-10), אז זה מאומת בקריאת קוד/build
  בלבד, לא בבדיקה אוטומטית — יש להוסיף כיסוי כשספק אמיתי/mock עם pending
  יהיה זמין.

### BUG-03 — גילוי חובה על ביטול תוכן דיגיטלי עדיין חסר בפועל בצ'קאאוט — ✅ תוקן
- **מיקום:** `site/src/pages/checkout/index.astro` — אין checkbox/טקסט גילוי
  כלשהו לפני כפתור התשלום.
- **תיאור:** אומת מחדש בקריאת קוד (2026-09-17): `legal/refund-policy.md` §4.2-
  4.3 דורש checkbox חובה ("קראתי והבנתי" לגבי פקיעת זכות ביטול עם תחילת צריכת
  תוכן דיגיטלי) **בעמוד הרכישה עצמו, לפני התשלום** — זה כבר תועד כפער ע"י
  סוכן 10 גם ב-`legal/refund-policy.md` §4.3 וגם ב-
  `docs/ACCESSIBILITY-CHECKLIST.md` פריט #8 ("Gate משפטי"). מאשר כאן: הפער
  **עדיין קיים בקוד** נכון לבדיקה זו — לא תוקן.
- **שיוך:** סוכן 1 (יישום) + סוכן 5 (ניסוח קופי) + סוכן 10 (ניסוח משפטי מדויק).
- **חוסם:** שער 5 (וגם שער 2 בפועל — אי אפשר לחייב כרטיס אמיתי בלי הגילוי הזה).
- **תיקון בפועל:** `site/src/pages/checkout/index.astro` — נוסף `checkbox`
  חובה (`id="refund-consent"`, `required`) בתוך הטופס, לפני כפתור התשלום,
  עם הנוסח המדויק מ-`legal/refund-policy.md` §4.2 (כולל קישור ל-"מדיניות
  הביטולים המלאה"). כפתור "שלם/י" מתחיל עם `disabled` ב-markup (הגנה גם
  בלי JS), ובסקריפט נוספה `updatePayButtonState()` שמנטרלת/מפעילה את
  הכפתור לפי `consentCheckbox.checked` (ומשולבת עם מצב `isSubmitting` כדי
  לא להתנגש עם ניטרול הכפתור בזמן קריאת הרשת). כהגנת-עומק נוספת, ה-handler
  של ה-`submit` בודק שוב את מצב ה-checkbox ומציג הודעת שגיאה אם נלחץ בעקיפין.

### BUG-04 — אין slot לפרטי עוסק ב-checkout וב-success, ולא רק ב-index — ✅ תוקן
- **מיקום:** `site/src/pages/checkout/index.astro`, `site/src/pages/checkout/success.astro`.
- **תיאור:** `legal/terms.md` §2.1 קובע במפורש: "פרטים אלה [פרטי העוסק]
  יופיעו **גם** בעמוד/תהליך הרכישה (checkout) וגם באישור הרכישה הנשלח
  ללקוחה לאחר התשלום — **לא רק בתקנון**". בפועל, `index.astro` לפחות כולל
  slot/placeholder ל"פרטי העוסק" בפוטר (שורות 43-54, עם הפניה ל-BLOCKERS #4).
  **לעומת זאת, לא ב-`checkout/index.astro` ולא ב-`checkout/success.astro`
  קיים אפילו placeholder/slot מבני לפרטי העוסק** — success.astro (שורות 6-14)
  מציג רק הודעת תודה גנרית placeholder בלי שום איזכור לעוסק. זו **תשובה
  ישירה** לשאלת הבדיקה "האם success.astro מציג פרטי עוסק כפי שדרש סוכן 10" —
  **לא, לא בצורה כלשהי, אפילו לא כ-placeholder**.
- **שיוך:** סוכן 1 (מבנה/slot) בתיאום עם סוכן 10 (תוכן מדויק, חסום גם ע"י
  BLOCKERS #4 בפועל).
- **חוסם:** שער 5. חלקית תלוי גם ב-BLOCKERS #4 (אין עדיין את הפרטים עצמם),
  אבל חוסר ה-slot המבני הוא פער קוד עצמאי שלא תלוי בפתרון החסם.
- **תיקון בפועל:** נוספה שורת `<p class="merchant-info small">` תמציתית עם
  ה-placeholder `[שם עוסק / ע.מ. XXXXXXXXX]` וקישור לתקנון, גם ב-
  `site/src/pages/checkout/index.astro` (מיד אחרי מחיר המוצר, לפני הטופס)
  וגם ב-`site/src/pages/checkout/success.astro` (אחרי הודעת התודה). **הערה
  חשובה:** הקישור הוא ל-`/terms`, אבל נתיב זה **עדיין לא קיים כדף באתר**
  (רק `legal/terms.md` כקובץ מקור) — זה forward-reference עקבי עם שאר
  ה-placeholders בקוד (כמו ה-slot ב-`index.astro` footer), אבל **צריך
  שמישהו יבנה את `site/src/pages/terms.astro` (וכנראה גם `/refund-policy`,
  שגם אליו יש עכשיו קישור מה-checkbox של BUG-03) לפני שער 5**, אחרת אלה
  קישורי 404 בפרודקשן. זה מעבר להיקף 5 הבאגים הספציפיים כאן (סוכן 11 לא
  דרש בניית דפי תקנון), אז לא נבנה כחלק מתיקון זה — מסומן כאן כפריט מעקב
  חדש שממליץ לתאם עם סוכן 10/5 לפני שער 5.

### BUG-05 — `index.astro` עדיין בלי `<main>` landmark, ואין skip-link — ✅ תוקן
- **מיקום:** `site/src/pages/index.astro` (כל הדף יושב ישירות תחת `<body>`,
  אין `<main>`); `site/src/layouts/BaseLayout.astro` (אין skip-link).
- **תיאור:** אומת מחדש בקריאת קוד: הממצאים ב-`docs/ACCESSIBILITY-CHECKLIST.md`
  §2.1 ו-§2.2 (סוכן 10) **עדיין נכונים ולא תוקנו** — עמוד המכירה, בעל התנועה
  הגבוהה ביותר לפי `docs/PROJECT-BRIEF.md`, עדיין חסר landmark `<main>` וחסר
  skip-link בכל האתר.
- **שיוך:** סוכן 1.
- **חוסם:** שער 5, לפי הגדרת התפקיד המפורשת של סוכן 10 (פריטים 1+2 ברשימת
  "פעולות נדרשות לפני שער 5").
- **תיקון בפועל:** `site/src/pages/index.astro` — כל תוכן הדף (Hero + שני
  ה-`section`-ים) עטוף כעת ב-`<main id="main-content">` (ה-`footer` נשאר
  מחוץ ל-`main` בכוונה, כי הוא כבר landmark נפרד — `contentinfo`).
  `site/src/layouts/BaseLayout.astro` — נוסף skip-link
  (`<a href="#main-content" class="skip-link">דלג לתוכן הראשי</a>`) כאלמנט
  הראשון בתוך `<body>`, מוסתר ויזואלית (`top: -100px`) וקופץ למקומו רק
  בקבלת פוקוס מקלדת (`:focus { top: var(--space-3) }`), עם מיקום לפי
  `inset-inline-start` כדי לכבד RTL. כדי שה-skip-link יעבוד בפועל בכל
  הדפים (לא רק ב-`index.astro`), נוסף `id="main-content"` גם ל-`<main>`
  הקיים כבר ב-`checkout/index.astro`, `checkout/success.astro`
  ו-`waitlist.astro` (עדכון עקבי, לא ממצא QA נפרד).

---

## 🟡 לא-חוסמים (לתקן, לא עוצר שער נוכחי)

### BUG-06 — אין fallback ל-no-JS בטופס הצ'קאאוט; PII עלול לדלוף ל-URL
- **מיקום:** `site/src/pages/checkout/index.astro` — `<form id="checkout-form">`
  בלי `method`/`action`.
- **תיאור:** כל הלוגיקה של שליחת הטופס היא ב-`<script>` בלבד
  (`e.preventDefault()` + `fetch`). אם ה-JS לא נטען (רשת 3G רעה בדיוק כפי
  שמתואר כקהל היעד ב-`docs/PROJECT-BRIEF.md`/הערת הביצועים ב-
  `BaseLayout.astro`), שליחת הטופס תבצע ניווט `GET` רגיל של הדפדפן לאותו
  URL עם **כל פרטי הלקוחה (שם/טלפון/אימייל) כ-query string גלוי**, בלי שום
  הודעת שגיאה — נראה כאילו "כלום לא קרה". גם דליפת PII ל-URL/היסטוריית
  דפדפן/לוגי שרת, וגם UX שקט-מדי בדיוק ברגע הכי קריטי (תשלום).
- **שיוך:** סוכן 1.
- **סטטוס:** לא חוסם כרגע (checkout כבוי גלובלית), אבל מומלץ מאוד לתקן
  (`method="post"` עם fallback שרת, או לפחות `<noscript>` עם הודעה) **לפני**
  הפעלת `CHECKOUT_ENABLED`.

### BUG-07 — אין מרכיב מלאה (ledger) לחיבור webhook ↔ הזמנה ↔ success
- **מיקום:** `site/functions/api/checkout/webhook.ts` (TODO בשורות 31-33),
  `site/src/pages/checkout/success.astro`.
- **תיאור:** הצגת success היום מבוססת **אך ורק** על תשובת ה-`fetch` הסינכרונית
  מ-`/api/checkout/create` בצד הלקוח (`result.status === "approved"`
  → redirect). ה-webhook (המקור הסמכותי לאירועים אסינכרוניים לפי
  `docs/ARCHITECTURE.md` §3.5) לא כותב לשום מקום שמשותף עם success/עם מנגנון
  מסירת גישה — כרגע רק `console`/TODO. זה כבר מתועד כ-TODO מודע ב-
  `docs/ARCHITECTURE.md` (לא ממצא חדש), אבל מאשר כאן שהוא **עדיין לא
  ממומש** ושה-success page **אינה מאמתת דבר מול השרת** — קליטת JSON כלשהו עם
  `status: "approved"` (למשל ע"י מניפולציה בקונסול/DevTools) תוביל ל-redirect
  לאותו success page בלי שום בדיקה נוספת. לא מסוכן היום (אין גישה בתמורה
  אמיתית ל-success page עדיין), אבל **חובה** לסגור לפני שסוכן 8 בונה את
  מנגנון מסירת הגישה בפועל, כדי שהגישה תינתן רק לפי אישור מאומת מהשרת/webhook,
  לא לפי מה שהדפדפן "מדווח" על עצמו.
- **שיוך:** סוכן 1 (תשתית) + סוכן 8 (המסלול שישתמש בזה).
- **סטטוס:** לא חוסם היום; **יהפוך לחוסם** ברגע שמנגנון מסירת גישה אמיתי ייבנה.

### BUG-08 — אמוג'י בכותרת success.astro
- **מיקום:** `site/src/pages/checkout/success.astro` שורה 8:
  `<h1>התשלום התקבל 🎉</h1>`.
- **תיאור:** אומת מחדש — `docs/ACCESSIBILITY-CHECKLIST.md` §5 כבר מזהה את
  זה כקוסמטי/עדיפות נמוכה. עדיין לא תוקן.
- **שיוך:** סוכן 1. עדיפות נמוכה.

### BUG-09 — חוסר עקביות בטופס waitlist מול checkout
- **מיקום:** `site/src/pages/waitlist.astro` שורות 22-24, 27.
- **תיאור:** אומת מחדש — חסר `aria-live="polite"` מפורש על
  `#waitlist-status` (יש רק `role="status"`), וחסר `autocomplete`/`inputmode`
  על שדה `contact` המעורב, בניגוד לעקביות שיש בטופס הצ'קאאוט. כבר מתועד
  ב-`docs/ACCESSIBILITY-CHECKLIST.md` §3.2-3.3 (פריט #3 ברשימה המרוכזת).
  עדיין לא תוקן.
- **שיוך:** סוכן 1.

### BUG-10 — אין בדיקות דפדפן/E2E אמיתיות, רק בדיקות לוגיקה ב-Node
- **תיאור:** `npm run test:payments` ו-`npm run loadtest:local` בודקים אך ורק
  את שכבת ה-adapter/idempotency **בתהליך Node**, לא את הדפים/הטפסים/ה-JS
  בפועל בדפדפן (לא Playwright/Cypress/וכו'). כל האימות שביצעתי על
  זרימת ה-UI (`checkout/index.astro`, redirect, live-region, וכו') היה קריאת
  קוד + בדיקת פלט build, לא הרצה אוטומטית בדפדפן אמיתי. זו לא "תקלה" אלא
  פער תשתית בדיקה שממליץ QA-lead לסגור **לפני שער 5 הסופי** (בפרט לפני
  שמחברים ספק תשלום אמיתי) — כלי מוצע: Playwright, כדי לתפוס רגרסיות
  ב-BUG-01/02/06 באופן אוטומטי.
- **שיוך:** סוכן 1 + סוכן 11 (אני) — לתאם מי בונה את זה.

### BUG-11 — הפעלת/כיבוי `CHECKOUT_ENABLED` נקבעת ב-build time, לא runtime
- **מיקום:** `site/astro.config.mjs` (`output: "static"`), `site/src/pages/checkout/index.astro`.
- **תיאור:** מאומת בפועל: הרצתי `npm run build` ובדקתי את
  `site/dist/checkout/index.html` — כש-`PUBLIC_CHECKOUT_ENABLED` לא מוגדר,
  ה-`Astro.redirect("/waitlist")` נאפה **לתוך HTML סטטי** (meta-refresh) כבר
  בזמן ה-build, לא בזמן בקשה. זה תקין ואף חזק יותר מהגנת runtime (אין דרך
  "לעקוף" בלי build מחדש) — אבל המשמעות המעשית: **אי אפשר "להדליק" checkout
  בלי build+deploy מחדש** עם משתנה הסביבה הנכון. יש לוודא שזה מתועד במפורש
  בתהליך החתימה על שער 2 (LOAD-TEST-LOG.md)/ב-runbook הפריסה, כדי שלא
  יקרה מצב של "הדלקנו את הדגל בסביבת האירוח אבל זה לא השפיע כי לא בנינו
  מחדש". לא באג בקוד — הערת תהליך/תיעוד.
- **שיוך:** סוכן 1.

---

## ⚪ לא ניתן לבדיקה עדיין (רכיב לא קיים בפועל)

| # | מסלול כשל נדרש (לפי הגדרת תפקיד סוכן 11 / PROJECT-BRIEF) | סטטוס | שיוך |
|---|---|---|---|
| 1 | ניסיון גישה לקורס בלי גישה תקפה | אין שום route/עמוד קורס/גישה בקוד (`site/src/pages`) — לא נבנה עדיין | סוכן 8 (חוויית לקוח) + סוכן 1 |
| 2 | מייל אישור לא מגיע | לא ממומש — `success.astro` שורות 9-12 הן placeholder מפורש, אין שליחת מייל בקוד בכלל | סוכן 8 |
| 3 | קוד קופון לא תקף | לא קיים בקוד (`ChargeRequest` ללא שדה קופון), ולא נדרש במפורש ב-`docs/PROJECT-BRIEF.md` — לא רלוונטי כרגע, לא ממצא | — |
| 4 | תשלום מול ספק אמיתי (sandbox) — כרטיס נדחה אמיתי, 3D-secure, וכו' | חסום לגמרי — `grow.ts`/`cardcom.ts`/`meshulam.ts` הם stubs שזורקים `ProviderNotConfiguredError` (BLOCKERS.md #2) | סוכן 1, תלוי במשתמש |
| 5 | קישור לשיעור מוביל לתוכן הנכון (סוכן 2) | אין שום קישור מ-`success.astro` (או מכל דף אחר) לתוכן ב-`course/lesson-*.md` — אין route שמגיש את התוכן בכלל | סוכן 1 + סוכן 2 |
| 6 | תבניות תמיכה (סוכן 8) עונות על המציאות בבדיקה | `support/` ריקה לחלוטין; `docs/CUSTOMER-JOURNEY.md`, `docs/SUPPORT-ESCALATION.md` לא קיימים עדיין | סוכן 8 |
| 7 | עומס מול תשתית פריסה אמיתית (CDN/Edge/latency אמיתי) | אין סביבת פריסה (BLOCKERS.md #5) — נבדק רק adapter-level מקומי | סוכן 1, תלוי במשתמש |
| 8 | בדיקת קורא-מסך אמיתית (NVDA/VoiceOver) | לא בוצעה — רק קריאת קוד (כמצוין גם ע"י סוכן 10 בעצמו) | סוכן 10 + סוכן 11 |
| 9 | פרטי עוסק בפועל בתקנון/checkout/success | חסום לחלוטין — BLOCKERS.md #4, המשתמש טרם סיפק | סוכן 10, תלוי במשתמש |
| 10 | וידאו שיעורים + כתוביות (נגישות 1.2.2) | אין תוכן וידאו קיים עדיין (BLOCKERS.md #3, חשבונות AI חסומים) | סוכן 6, תלוי במשתמש |

---

## סיכום מספרי

- 🔴 חוסמים: **5** (BUG-01 עד BUG-05) — **כולם תוקנו** ע"י `site-payments-lead`
  ב-2026-09-17 (ראה פרטי תיקון בכל סעיף למעלה; `build`/`test:payments`/`tsc
  --noEmit` ירוקים לאחר התיקונים).
- 🟡 לא-חוסמים: **6** (BUG-06 עד BUG-11) — עדיין פתוחים, לא בהיקף סבב תיקון זה.
- ⚪ לא ניתן לבדיקה: **10** תרחישים/רכיבים

**מסקנה (מעודכן 2026-09-17 ע"י site-payments-lead):** 5 החוסמים שנמצאו בקוד
עצמו (לא תלויים בחסמים חיצוניים) תוקנו: idempotency ששורד רענון דף
(sessionStorage), טיפול UI ב-`pending`/`redirectUrl` להכנה מראש לספקי
hosted-checkout, checkbox חובה לגילוי ויתור זכות ביטול לפי
`legal/refund-policy.md` §4.2, slot מבני לפרטי עוסק ב-checkout/success, ו-
`<main>`+skip-link לנגישות. **נשאר פער עקבי חדש שנחשף תוך כדי תיקון BUG-04**:
הקישורים ל-`/terms` ו-`/refund-policy` שנוספו לצורך הגילוי המשפטי מצביעים
לנתיבים שעדיין לא קיימים כדפי Astro בפועל (רק כקבצי markdown ב-`legal/`) —
יש לבנות אותם (`site/src/pages/terms.astro`, `.../refund-policy.astro`) לפני
שער 5, אחרת אלה קישורי 404 בפרודקשן; זה מחוץ להיקף 5 הבאגים הספציפיים
שתוקנו כאן. שאר הבאגים הלא-חוסמים (BUG-06 עד BUG-11) עדיין פתוחים.
