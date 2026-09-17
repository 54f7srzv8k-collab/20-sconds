import { defineConfig } from "astro/config";

// שלד ראשוני: פלט סטטי טהור (output: "static"), בלי אדפטר שרת.
// כל דף מכירה/תוכן הוא HTML+CSS סטטי שמוגש מ-CDN — ראה docs/ARCHITECTURE.md
// § "static-first + checkout מבודד". ה-checkout עצמו לא רץ כ-Astro
// SSR route אלא כ-Cloudflare Pages Function נפרדת (functions/api/checkout/*),
// כדי שעומס/תקלה בצד אחד לא ישפיעו על השני.
export default defineConfig({
  output: "static",
  build: {
    // inline assets קטנים כדי לצמצם round-trips ברשת מובייל איטית
    inlineStylesheets: "auto",
  },
});
