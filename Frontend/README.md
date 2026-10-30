# Echo – צד הלקוח

ממשק הצ'אט של **Echo**, אפליקציית צ'אט בסגנון ChatGPT בעברית וב-RTL.
הפרויקט בנוי ב-React עם Vite, מתקשר ל-FastAPI דרך REST, ותומך בשיחות מרובות,
Markdown, בלוקי קוד עם העתקה, מצב כהה ותצוגה מלאה במובייל.

## תכונות עיקריות

- ממשק אנגלי מלא עם `dir="ltr"` והודעות עם `dir="auto"` לעברית, אנגלית וקוד.
- Sidebar עם שיחה חדשה, רשימת שיחות, שיחה פעילה ומחיקה.
- שיחה חדשה נפתחת באופן עצל: השיחה נוצרת בשרת רק כשנשלחת ההודעה הראשונה,
  כך שלא נוצרות שיחות ריקות.
- טעינת היסטוריית שיחה מהשרת בלחיצה על שיחה קיימת.
- תשובות Assistant מוצגות ב-Markdown, כולל טבלאות ובלוקי קוד עם כפתור העתקה.
- אנימציית הקלדה, גלילה אוטומטית, מצב ריק נקי וטיפול ידידותי בשגיאות.
- מצב בהיר וכהה, בחירת צבע accent ושמירת הבחירות ב-`localStorage`.
- עיצוב רספונסיבי למחשב, טאבלט ומובייל, כולל Sidebar נפתח במובייל.

## דרישות מקדימות

- Node.js 20.19 ומעלה (מומלץ Node 22 או 24).
- שרת ה-Echo API פועל ב-`http://localhost:8000` (או בכתובת אחרת שתגדירו).

## התקנה והרצה

מתוך תיקיית `Frontend`:

```bash
npm install
```

יצירת קובץ סביבה מקומי:

Windows:

```powershell
Copy-Item .env.example .env
```

macOS / Linux:

```bash
cp .env.example .env
```

ברירת המחדל היא:

```dotenv
VITE_API_URL=http://localhost:8000
```

הרצת שרת הפיתוח:

```bash
npm run dev
```

כתובת ברירת המחדל של הלקוח: `http://localhost:5173`.

### בנייה לפרודקשן

```bash
npm run build
npm run preview
```

## חיבור לשרת

כל קריאות ה-API מרוכזות ב-`src/services/api.js`:

| Method | Endpoint | שימוש בממשק |
|---|---|---|
| `POST` | `/api/conversations` | יצירת שיחה בעת שליחת ההודעה הראשונה |
| `GET` | `/api/conversations` | רשימת השיחות ב-Sidebar |
| `GET` | `/api/conversations/{id}/messages` | טעינת שיחה קיימת |
| `POST` | `/api/conversations/{id}/messages` | שליחת הודעה וקבלת תשובת Echo |
| `DELETE` | `/api/conversations/{id}` | מחיקת שיחה |

הלקוח **אינו** שולח את היסטוריית השיחה ואינו מכיל מפתח OpenAI.
השרת הוא היחיד שמנהל את ההקשר והקריאות למודל.

אם משנים את `VITE_API_URL`, יש להפעיל מחדש את שרת הפיתוח.

## מבנה הפרויקט

```text
Frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── ChatInput.jsx / .css
│   │   ├── ChatWindow.jsx / .css
│   │   ├── EmptyState.jsx / .css
│   │   ├── Logo.jsx / .css
│   │   ├── MessageBubble.jsx / .css
│   │   ├── Navbar.jsx / .css
│   │   ├── Sidebar.jsx / .css
│   │   └── TypingIndicator.jsx / .css
│   ├── pages/
│   │   ├── Home.jsx / .css
│   │   └── About.jsx / .css
│   ├── services/
│   │   └── api.js
│   ├── styles/
│   │   ├── variables.css
│   │   └── global.css
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## עיצוב

- פלטת צבעים מרוכזת ב-`src/styles/variables.css`, עם CSS variables למצב בהיר וכהה.
- צבע ראשי ניתן לבחירה מתוך חמש פלטות accent; רקעים ניטרליים ונקיים.
- פונטים Manrope ו-Heebo מ-Google Fonts, עם fallback מקומי.
- הלוגו הוא SVG בקומפוננטת `Logo.jsx`, ומשמש גם כ-favicon וכ-avatar של Echo.
- אנימציות עדינות מופעלות רק כשהן מוסיפות הבנה, ומכובדת העדפת
  `prefers-reduced-motion`.

## התאמה אישית

בעמוד `src/pages/About.jsx` מוגדר שם המפתחת:

```js
const DESIGNER_NAME = "Avigail Sharmmeister";
```

## אבטחה

- אין מפתחות API או סודות בקוד הלקוח.
- `.env` נמצא ב-`.gitignore`.
- כל התקשורת עם OpenAI מתבצעת בצד השרת בלבד.
