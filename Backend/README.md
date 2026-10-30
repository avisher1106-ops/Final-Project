# Echo API

צד השרת של **Echo** – אפליקציית צ'אט בסגנון ChatGPT. הפרויקט מספק REST API בלבד;
לקוח ה-React הוא פרויקט נפרד שמתקשר עם השרת דרך HTTP. כל קריאות OpenAI מתבצעות
בצד השרת, ומפתח ה-API ופרטי מסד הנתונים נשמרים רק בקובץ `.env`.

הפרויקט עובד מול **שרת MySQL אמיתי בלבד**, באמצעות SQLAlchemy ו-PyMySQL.
אין שימוש ב-SQLite, אין מסד נתונים מקומי בקובץ ואין מנגנון fallback למסד אחר.

## תכונות עיקריות

- פתיחת שיחות נפרדות, שחזור היסטוריה ומחיקה מלאה של שיחה.
- שמירת כל הודעה עם `role` (`user` / `assistant`) ושיוך לשיחה.
- שליחת כל היסטוריית השיחה ל-OpenAI בכל הודעה חדשה, כדי לשמור על הקשר.
- הגבלת מספר ההודעות הקודמות שנשלחות למודל בשיחות ארוכות במיוחד.
- יצירת כותרת אוטומטית מההודעה הראשונה של המשתמש.
- ולידציה עם Pydantic, קודי HTTP מתאימים, טיפול בשגיאות ידידותי ו-logging.
- תיעוד API אוטומטי דרך Swagger UI.

## טכנולוגיות

- Python 3.10+
- FastAPI + Uvicorn
- MySQL 8.0+ עם SQLAlchemy ORM ו-PyMySQL
- OpenAI Python SDK
- python-dotenv
- Pydantic v2

## מבנה הפרויקט

```text
Backend/
├── main.py                         # נקודת הכניסה, CORS, lifespan, טיפול בשגיאות
├── config.py                       # טעינת .env ומבנה הגדרות מרוכז
├── database/
│   ├── __init__.py                 # ייצוא מפורש של רכיבי מסד הנתונים
│   ├── database.py                 # engine, SessionLocal, Base, get_db
│   ├── models.py                   # מודלי SQLAlchemy
│   └── schema.sql                  # יצירת מסד הנתונים והטבלאות
├── schemas.py                      # סכמות Pydantic
├── routers/
│   ├── __init__.py
│   └── conversations.py            # כל נקודות הקצה
├── services/
│   ├── __init__.py
│   └── openai_service.py           # קריאה ל-OpenAI ובניית ההיסטוריה
├── echo.postman_collection.json    # אוסף Postman לכל ה-endpoints
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

## התקנה והרצה

### 1. דרישות מקדימות

- Python 3.10 ומעלה.
- שרת MySQL פעיל (גרסה 8.0 ומעלה מומלצת).
- מפתח OpenAI תקין.

### 2. יצירת סביבה וירטואלית והתקנת חבילות

יש לבצע את הפקודות מתוך תיקיית השרת (`Backend`) ובסדר הזה.

Windows Command Prompt (cmd):

```bat
python -m venv env
env\Scripts\activate
pip install -r requirements.txt
```

אם עובדים ב-Windows PowerShell, הפקודה המקבילה להפעלה היא:

```powershell
python -m venv env
.\env\Scripts\Activate.ps1
pip install -r requirements.txt
```

אם PowerShell חוסם סקריפטים, אפשר להריץ פעם אחת:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

בסיום ההתקנה, הפרומפט אמור להתחיל ב-`(env)`. אין להשתמש ב-`venv` או ב-`source`;
שם הסביבה בפרויקט הוא **`env`**, והיא נמצאת ב-`.gitignore`.

### 3. יצירת קובץ `.env`

```powershell
Copy-Item .env.example .env
```

או במערכות Unix:

```bash
cp .env.example .env
```

יש לערוך את `.env` ולהזין ערכים אמיתיים:

```dotenv
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=echo_db

MAX_HISTORY_MESSAGES=20
```

`.env` נמצא ב-`.gitignore` ואין להעלות אותו ל-Git. `.env.example` מכיל ערכי דוגמה בלבד.

### 4. יצירת מסד הנתונים

```bash
mysql -u root -p < database/schema.sql
```

ב-Windows PowerShell אפשר להריץ:

```powershell
cmd /c "mysql -u root -p < database/schema.sql"
```

אפשר גם לייבא את `database/schema.sql` דרך MySQL Workbench (Server → Data Import).

הקובץ יוצר את מסד הנתונים `echo_db` ואת הטבלאות. אם משנים את `DB_NAME` ב-`.env`,
צריך לעדכן את שם מסד הנתונים גם ב-`database/schema.sql`. מסד הנתונים עצמו חייב להתקיים לפני
עליית השרת; הטבלאות נוצרות אוטומטית גם בעליית השרת באמצעות SQLAlchemy.

החיבור מוגדר תמיד כ-`mysql+pymysql` ונבנה מפרטי `DB_HOST`, `DB_PORT`, `DB_USER`,
`DB_PASSWORD` ו-`DB_NAME` שב-`.env`. `database/database.py` כולל בדיקה מפורשת שמונעת הפעלה
עם דרייבר שאינו MySQL/PyMySQL.

### 5. הרצת השרת

```bat
uvicorn main:app --reload
```

כתובת ברירת המחדל: `http://localhost:8000`.

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### 6. React

שרת הפיתוח של React יכול לרוץ על `http://localhost:5173` או
`http://localhost:3000`, ותצוגת ה-preview של Vite על
`http://localhost:4173`; כל הכתובות מורשות ב-CORS (וגם כתובות ה-`127.0.0.1`
המקבילות).

## Endpoints

| Method | Path | תיאור | סטטוסים |
|---|---|---|---|
| `POST` | `/api/conversations` | פתיחת שיחה חדשה | `201` |
| `GET` | `/api/conversations` | כל השיחות, מהחדשה לישנה | `200` |
| `GET` | `/api/conversations/{id}/messages` | היסטוריית שיחה לפי סדר כרונולוגי | `200`, `404` |
| `POST` | `/api/conversations/{id}/messages` | שליחת הודעה וקבלת תשובת Echo | `201`, `404`, `422`, `502` |
| `DELETE` | `/api/conversations/{id}` | מחיקת שיחה וכל הודעותיה | `204`, `404` |
| `GET` | `/` | בדיקת חיות פשוטה וקישור ל-Swagger | `200` |

### דוגמת בקשה ושליחה

פתיחת שיחה:

```http
POST /api/conversations
```

תשובה:

```json
{
  "id": 1,
  "title": "",
  "created_at": "2026-10-29T10:00:00",
  "updated_at": "2026-10-29T10:00:00"
}
```

שליחת הודעה:

```http
POST /api/conversations/1/messages
Content-Type: application/json

{
  "content": "Tell me a one-liner programming joke"
}
```

תשובה:

```json
{
  "user_message": {
    "id": 1,
    "role": "user",
    "content": "Tell me a one-liner programming joke",
    "created_at": "2026-10-29T10:01:00"
  },
  "assistant_message": {
    "id": 2,
    "role": "assistant",
    "content": "Why do programmers prefer dark mode? Because light attracts bugs.",
    "created_at": "2026-10-29T10:01:02"
  }
}
```

ההודעה הבאה, `"still one-liner, but change the subject"`, נשלחת לאותו
`conversation_id`. השרת טוען מהמסד את כל ההיסטוריה של אותה שיחה, ולכן המודל יודע
מה הייתה הבדיחה הקודמת.

## איך נשמר ההקשר

1. הודעת המשתמש נשמרת בטבלת `messages` עם `role = "user"`.
2. אם זו ההודעה הראשונה, נגזרת כותרת קצרה מתוכן ההודעה ונשמרת ב-`conversations.title`.
   שאלת הלקוח נשמרת גם ב-`conversations.question`, והתשובה הקודמת מתאפסת.
3. השרת שולף את כל הודעות השיחה לפי `created_at` ו-`id`.
4. ההיסטוריה מומרת לפורמט של OpenAI ונוספת לה הודעת מערכת:
   `"You are Echo, a helpful, friendly assistant..."`.
5. אם ההיסטוריה ארוכה, נשלחות רק `MAX_HISTORY_MESSAGES` ההודעות האחרונות
   (ברירת מחדל: 20). כל ההודעות נשמרות במסד במלואן.
6. תשובת העוזר נשמרת עם `role = "assistant"`, נכתבת ל-`conversations.answer`
   ומוחזרת יחד עם הודעת המשתמש.

## מבנה מסד הנתונים

### `conversations`

| עמודה | סוג | פירוט |
|---|---|---|
| `id` | `INT` | מפתח ראשי, auto-increment |
| `title` | `VARCHAR(255)` | כותרת השיחה; ריקה עד להודעה הראשונה |
| `question` | `TEXT` | שאלת הלקוח האחרונה בשיחה |
| `answer` | `TEXT` | תשובת Echo האחרונה; `NULL` עד לקבלת תשובה |
| `created_at` | `DATETIME` | זמן יצירת השיחה |
| `updated_at` | `DATETIME` | זמן עדכון אחרון של השיחה |

### `messages`

| עמודה | סוג | פירוט |
|---|---|---|
| `id` | `INT` | מפתח ראשי, auto-increment |
| `conversation_id` | `INT` | מפתח זר ל-`conversations.id`, עם `ON DELETE CASCADE` |
| `role` | `ENUM('user','assistant')` | מי כתב את ההודעה |
| `content` | `TEXT` | תוכן ההודעה |
| `created_at` | `DATETIME` | זמן יצירת ההודעה |

קיים אינדקס `idx_messages_conversation_id` על `messages.conversation_id`, כדי
לשלוף היסטוריה של שיחה ביעילות.

## ולידציה וטיפול בשגיאות

- `content` חייב להיות בין 1 ל-4,000 תווים; רווחים בלבד נדחים עם `422`.
- שיחה לא קיימת מחזירה `404` עם `{"detail": "Conversation with id ... was not found."}`.
- כשל ב-OpenAI מחזיר `502` עם הודעת `detail` ידידותית; פרטי השגיאה המלאים נרשמים
  רק ב-log של השרת.
- כשל במסד הנתונים מחזיר `500` עם JSON ידידותי, ללא stack trace.
- השרת אינו חושף את מפתח OpenAI, את סיסמת מסד הנתונים או פרטי פנים של הספריות.

הערה: אם OpenAI נכשל לאחר שהודעת המשתמש כבר נשמרה, ההודעה נשארת במסד והבקשה
מחזירה `502`. כך אפשר לנסות שוב בלי לאבד את מה שהמשתמש כתב.

## Postman

1. ייבוא `echo.postman_collection.json` אל Postman.
2. ודאו שמשתנה `baseUrl` הוא `http://localhost:8000`.
3. הריצו קודם את `01 - Create conversation`; הסקריפט שומר את ה-`id` החדש
   במשתנה `conversationId`.
4. הריצו את שאר הבקשות. `05 - Send contextual follow-up` מדגים שמירת הקשר.
5. `07 - Missing conversation returns 404` מדגים טיפול בשגיאה.

## הערות אבטחה

- אין לשים מפתח API או סיסמת MySQL בקוד, ב-React או ב-Git.
- ה-React צריך לפנות רק ל-`/api/...`; אסור לו לפנות ישירות ל-OpenAI.
- ב-production יש להחליף את כתובות ה-CORS בכתובת הלקוח האמיתית, להשתמש ב-HTTPS
  ולהפעיל משתמש MySQL בהרשאות מינימליות.
