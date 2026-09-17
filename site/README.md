# site/ — Wake Up ☕️

שלד קוד ראשוני של אתר המכירה + הצ'קאאוט. נבנה ע"י `site-payments-lead` (סוכן 1),
גל 1. ראה `docs/ARCHITECTURE.md` בשורש הריפו להחלטות ונימוקים מלאים.

## התקנה מקומית

```bash
cd site
npm install
npm run dev       # http://localhost:4321
```

## מבנה

```
site/
├── src/
│   ├── pages/              # דפי Astro (index, waitlist, checkout/*)
│   ├── components/         # קומפוננטות אגנוסטיות לעיצוב (Hero, CTAButton)
│   ├── layouts/            # BaseLayout
│   ├── styles/tokens.css   # design tokens — היחיד שמשתנה כשהעיצוב יגיע
│   ├── lib/payments/       # payment gateway adapter (ראה למטה)
│   └── config.ts           # דגלי תצורה, כולל אכיפת שער 2
├── functions/api/checkout/ # Cloudflare Pages Functions — checkout מבודד
├── public/design/          # ריק בכוונה, ראה README שם (BLOCKERS.md #1)
└── scripts/                # בדיקות עצמיות (adapter + load test מקומי)
```

## Payment adapter

`src/lib/payments/` הוא שכבת ההפשטה מול ספקי תשלום. שימוש:

```ts
import { getPaymentProvider } from "./lib/payments/adapter";
const provider = getPaymentProvider(); // לפי PAYMENT_PROVIDER, ברירת מחדל "mock"
const result = await provider.createCharge({ ... });
```

ספקים ממומשים: `mock` (עובד תמיד, לבדיקות), `grow`/`cardcom`/`meshulam`
(שלד מוכן, זורק שגיאה מפורשת עד שמפתחות ה-API יסופקו — `docs/BLOCKERS.md` #2).

## בדיקות עצמיות

```bash
npm run test:payments    # תרחישי אישור/דחייה/timeout/כפל-שליחה מול mock
npm run loadtest:local   # concurrency מקומי על ה-adapter (לא infra אמיתי)
```

תוצאות מלאות + סטטוס שער 2: `state/LOAD-TEST-LOG.md` בשורש הריפו.
