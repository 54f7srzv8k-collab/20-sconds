# מפרט כלי הפקת וידאו AI — Wake Up ☕️

**סטטוס: חסום לביצוע בפועל, לא לתכנון.** ראה `docs/BLOCKERS.md` #3. המסמך הזה
מפרט בדיוק מה נדרש מכל כלי, כולל פרומפט מוכן אחד מ-`content/scripts/batch-01.md`
לכל כלי, כך שברגע שיש חשבון+API key — ההרצה היא "להריץ", לא "להתחיל לתכנן".

**עקרון מותג קשיח לכל כלי:** אנונימיות מוחלטת. אין להעלות/ליצור תמונת פנים אמיתית
של אדם מזוהה. אווטאר AI (HeyGen) הוא "פנים" סינתטית קבועה של המותג — לא ייצוג של
אדם אמיתי.

---

## 1. HeyGen — אווטאר קבוע ("הפנים" הסינתטיות של המותג)

### מה נדרש (חשבון + גישה)
- **תוכנית:** Creator+ ומעלה (התוכנית החינמית לא כוללת API access ומגבילה שימוש
  מסחרי/ייצור נפח).
- **API key:** Settings → API בחשבון HeyGen. יש לשמור כ-secret בסביבת ההפקה, לא
  בריפו הזה.
- **בחירת אווטאר קבוע:** יצירת/בחירת Avatar ID **אחד** שישמש לכל התוכן ללא יוצא
  מן הכלל — זו "הדמות" של המותג. לא מחליפים אווטאר בין סרטונים (עקביות = זיהוי
  מותג לאורך זמן, בלי חשיפת אדם אמיתי).
  - אפשרות א׳: Instant Avatar / Studio Avatar גנרי שמסופק ע"י הפלטפורמה (הכי בטוח
    מבחינת אנונימיות — לא מבוסס על שום אדם קיים בפרויקט).
  - אפשרות ב׳ (אם רוצים ייחודיות גבוהה יותר): יצירת Custom Avatar מגורם חיצוני
    ששכור *במפורש* לצורך זה ומחתום על ויתור זכויות מלא לשימוש כאווטאר AI מותאם.
    **דורש החלטת משתמש** — לא ברירת מחדל.
- **בחירת קול קבוע (Voice ID):** קול TTS אחד קבוע, תואם לרישום השפה במדריך הקול
  (טרם קיים סופית — ר' הערה בראש `content/scripts/batch-01.md`). קול עברי טבעי,
  לא רובוטי.
- **API endpoint רלוונטי:** Video Generation API (יצירת וידאו מטקסט + Avatar ID +
  Voice ID). דורש גם `avatar_id`, `voice_id`, וטקסט הסקריפט.

### פרומפט/קלט מוכן לדוגמה — תסריט 01 מהאצווה
טקסט מלא להעברה כ-`input_text` לאווטאר (הוק+גוף+CTA כרצף דיבור אחד, ללא שינויים):

```
יש לך 20 דקות ביום. זהו. זה כל מה שיש. אז בואי נשתמש בהן נכון, לא נוסיף עוד דבר
לרשימה.

אני לא הולכת להגיד לך לקום בחמש בבוקר. אני לא הולכת להגיד לך למצוא שעה שאין לך.
יש לך 20 דקות — לפני שהטלפון מתעורר איתך, לפני שמישהו צריך ממך משהו. לא עוד
משימה. 20 דקות שהן שלך, בסדר קבוע, בלי לחשוב כל בוקר מחדש "מה עכשיו". זה כל
ההבדל בין בוקר שבו את מגיבה לכולם, לבוקר שבו את כבר החלטת משהו לפני שהיום החליט
בשבילך.

אם 20 דקות זה סכום שאת יכולה להתחייב אליו — יש קישור בביו. בלי הבטחות גדולות,
בלי שינוי חיים דרמטי. רק 20 דקות.
```

**הגדרות נלוות מומלצות:** יחס מסך 9:16 (Reels/TikTok/Shorts), רקע ניטרלי/מותאם
מותג (לא סביבה שמזהה מיקום אמיתי), קצב דיבור מוגבר מעט מברירת המחדל (תואם לקצב
החיתוכים המהיר הנדרש ב-`docs/VIRAL-PATTERNS.md` §3).

---

## 2. Runway — B-roll, רקעים, מעברים

### מה נדרש
- **חשבון:** תוכנית בתשלום עם קרדיטים ל-Gen-video (Standard ומעלה, בהתאם לנפח
  הנדרש — 300-900 סרטון/חודש דורש תכנון קרדיטים בהיקף גדול, לא תוכנית בסיסית).
- **API key:** דרך Runway Developer Portal / API access בחשבון.
- **שימוש מיועד בפרויקט:** לא לדמות מדברת (זה תפקיד HeyGen) — ל-B-roll אווירתי,
  רקעים, מעברים, וסצנות דימיון (למשל תסריט 03 — before/after דמיוני) שאין להן
  שחקן/אווטאר מדבר.

### פרומפט מוכן לדוגמה — B-roll לתסריט 03 (before/after דמיוני)
טקסט-לווידאו (Gen-3/Gen-4, text-to-video), יחס 9:16, ~4 שניות לקליפ, ליצירת שני
קליפים נפרדים למונטאז' "היום מול הבוקר החדש":

**קליפ א׳ (המצב הנוכחי):**
```
Close-up handheld shot, dim morning bedroom, a hand reaching fast for a
smartphone on a nightstand, screen glow on face out of frame, cluttered
nightstand with papers and a half-empty coffee mug, slightly shaky camera,
anxious rushed energy, soft cool blue morning light, cinematic, vertical
9:16, no visible face, no text overlay, realistic, muted desaturated colors
```

**קליפ ב׳ (הבוקר החדש):**
```
Close-up steady shot, warm morning light through a window, a hand slowly
pouring hot water into a mug, calm unhurried motion, tidy minimal surface,
soft steam rising, phone visible face-down and untouched in the background,
peaceful grounded energy, warm golden light, cinematic, vertical 9:16, no
visible face, no text overlay, realistic, warm color grade
```

**הערת עריכה לסוכן 7:** שני הקליפים נועדו לחיתוך מהיר זה-לצד-זה (split/quick-cut)
תחת קול האווטאר של HeyGen שמדבר את גוף התסריט — לא קליפ עומד בפני עצמו.

---

## 3. Sora — סצנות טקסט-לווידאו

### מה נדרש
- **חשבון:** גישת Sora (דרך מנוי ChatGPT Plus/Pro/Team עם הרשאת Sora, או API
  ייעודי בהתאם למסלול הזמין באזור החשבון) + מכסת קרדיטים/דקות generation.
- **API key / גישה:** מפתח API בהתאם לערוץ הגישה שנבחר (OpenAI platform key
  עם הרשאת Sora, אם/כשזמין ל-API; אחרת ממשק האפליקציה עצמו לשימוש ידני עד
  שתיפתח גישת API).
- **שימוש מיועד בפרויקט:** סצנות דימיון/אווירה קולנועיות יותר מ-Runway — מתאים
  לפורמט POV (תסריט 06) שדורש תחושת מצלמה סובייקטיבית עשירה בפרטים.

### פרומפט מוכן לדוגמה — תסריט 06 (POV: הבוקר הראשון)
טקסט-לווידאו, יחס 9:16, סצנה רציפה קצרה (~6-8 שניות) לצילום POV:

```
First-person POV shot, subjective handheld camera as if from the viewer's own
eyes waking up, early morning bedroom, soft warm light, hand reaches toward an
alarm clock and turns it off without touching a phone, camera lingers on a
window with morning light, then tilts down to a warm drink being made on a
counter, calm slow pacing, intimate and quiet mood, vertical 9:16 cinematic,
no visible face of the viewer, no on-screen text, warm natural color grade,
soft depth of field
```

**הערת עריכה לסוכן 7:** משמש כרקע ויזואלי מתחת לקריינות/כתוביות של גוף התסריט
(האווטאר לא חייב להופיע בקליפ הזה עצמו — אפשר עריכת קול-על-תמונה לגרסת POV
טהורה בלי אווטאר נראה כלל).

---

## סיכום — מוכן לחיבור

| כלי | תפקיד בפרויקט | חסר להרצה | פרומפט לדוגמה מוכן |
|---|---|---|---|
| HeyGen | אווטאר קבוע דובר (הוק+גוף+CTA) | תוכנית Creator+‎ + API key + בחירת Avatar/Voice ID קבועים | ✅ תסריט 01 |
| Runway | B-roll/רקעים/מעברים | חשבון API + קרדיטים | ✅ תסריט 03 (2 קליפים) |
| Sora | סצנות POV/אווירה קולנועית | גישת Sora + API/גישת אפליקציה | ✅ תסריט 06 |

**כשהמפתחות יגיעו:** להריץ את שלושת הפרומפטים לעיל כבדיקת קצה-לקצה ראשונה
(smoke test) לפני הרצת כל 10 התסריטים באצווה — מוודא שהאיכות/הסטייל תואמים
לפני ייצור נפח.

**עד אז:** ממשיכים לייצר תסריטים נוספים ומפרטי הפקה (`batch-02.md` ואילך), ולבדוק
כלים זמינים לטיוטות חלקיות (Adobe/Canva במידה ומחוברים לסביבה) ל-A-roll פשוט
בזמן ההמתנה, כפי שמונחה ב-`.claude/agents/viral-content-ai-lead.md`.
