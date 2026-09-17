# Wake Up ☕️ — צוות סוכנים

מבנה: **מנצח (Orchestrator)** + **11 סוכני-מומחים**, כל אחד ברמת ראש צוות בתחומו —
מתכנן, מבצע, בודק את עצמו, ומשתפר על סמך תוצאות.

## קרא קודם
1. [`docs/PROJECT-BRIEF.md`](docs/PROJECT-BRIEF.md) — המטרה, האילוצים, מתמטיקת המשפך,
   וההערכה הגלויה של רמת הסיכון ביעד.
2. [`docs/BLOCKERS.md`](docs/BLOCKERS.md) — 4 חסמים שדורשים קלט מהמשתמש (עיצוב, ספק
   תשלום, מפתחות וידאו AI, זהות עוסק). אף סוכן לא פותר אותם לבד.
3. [`docs/WORK-ORDER.md`](docs/WORK-ORDER.md) — סדר עבודה, גלים, ותלויות.
4. [`docs/QUALITY-GATES.md`](docs/QUALITY-GATES.md) — 5 שערי האיכות שהעבודה מתכנסת אליהם.

## הסוכנים
מוגדרים כ-Claude Code subagents ב-`.claude/agents/`, מופעלים דרך `wakeup-orchestrator`:

| # | סוכן | תחום |
|---|---|---|
| — | `wakeup-orchestrator` | ניהול, תיזמון, אכיפת שערים |
| 1 | `site-payments-lead` | אתר, עומס, תשלום, ניטור שגיאות |
| 2 | `course-content-lead` | תוכן 6 שיעורי הקורס + PDF |
| 3 | `brand-voice-lead` | דמות, קול מותג, מדריך קול (שער 1) |
| 4 | `proven-words-lead` | בנק מילים מוכרות, מתעדכן שוטף |
| 5 | `sales-copy-lead` | עמוד מכירה, מיילים, כתוביות, A/B |
| 6 | `viral-content-ai-lead` | נפח תוכן ויראלי + וידאו AI (שער 3) |
| 7 | `video-editing-lead` | עריכה + retention |
| 8 | `customer-experience-lead` | מסלול לקוח, תמיכה |
| 9 | `data-analytics-lead` | מדדים, דיווח אמת (שער 4) |
| 10 | `compliance-accessibility-lead` | נגישות, חוק הגנת הצרכן |
| 11 | `qa-e2e-lead` | בדיקת קצה-לקצה (שער 5) |

## מצב נוכחי
- **הריפו היה ריק** בתחילת הפרויקט — קבצי העיצוב שהבריף מפנה אליהם אינם קיימים.
  ראה `docs/BLOCKERS.md` #1.
- גל 1 (סוכנים 1, 3, 6, 2, 10, 9) הופעל במקביל, לפי הנחיית המשתמש.
- מעקב חי: `state/ORCHESTRATOR-LOG.md`, `state/DASHBOARD.md`, `state/GATES-LOG.md`.
