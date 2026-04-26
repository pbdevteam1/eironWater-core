# מפרט API ל-`POST /WCP/sendCBemail` (לקלוד) + עדכון Headers בצד הלקוח

## חלק 1 — מפרט מלא לקלוד (צד שרת)

### Endpoint
```
POST https://testapis-pb.api-connect.co.il/WCP/sendCBemail
```

### Headers שהלקוח שולח (כמו בשאר ה-API באתר)
| Header           | ערך                              | חובה | הערות |
|------------------|----------------------------------|------|-------|
| `Content-Type`   | `application/json`               | ✅   | תמיד JSON |
| `realm`          | `meieiron`                       | ✅   | מזהה את הלקוח/ארגון — זהה לכל קריאות ה-API באתר |
| `x-api-key`      | `<accessToken>` של המשתמש המחובר | ✅   | טוקן שהתקבל מ-`/loginPage` או `/verifyOtp` |
| `access-token`   | `<accessToken>` (כפול, לתאימות)  | ✅   | חלק מה-endpoints (GET) קוראים את הטוקן מתוך `access-token` במקום `x-api-key`. כדי שלקלוד תהיה גמישות — נשלח את שניהם, אותו ערך. |

> הערה: בכל ה-API באתר התבנית קבועה — `realm` תמיד `meieiron`, והטוקן עובר תחת `x-api-key` (ב-POST) או `access-token` (ב-GET). כאן נשלח את שניהם כדי לאפשר לצד-השרת לבחור.

### Body (JSON)
```json
{
  "to": "user@example.com",
  "subject": "פנייה ABC123 / استفسار ABC123",
  "body": "שלום,\n\nבהמשך לפנייתך באתר מי עירון...\n\n— — —\n\nالسلام عليكم،\n\nتكملةً لاستفساركم...",
  "bodyHtml": "<!DOCTYPE html><html lang=\"he\" dir=\"rtl\">...<body dir=\"rtl\">...</body></html>",
  "contentType": "text/html",
  "language": "he",
  "direction": "rtl",
  "metadata": {
    "lookupCode": "ABC123",
    "phoneNumber": "0501234567",
    "customerCity": "כפר קרע",
    "formUrl": "https://example.com/form/ABC123",
    "attachedFormLink": true,
    "insertDate": "2026-04-21T13:48:28.1839301"
  }
}
```

### סכמת השדות
| שדה                          | טיפוס    | חובה | תיאור |
|-------------------------------|----------|------|-------|
| `to`                          | string   | ✅   | כתובת מייל יחידה של הנמען. אם בעתיד יהיה צורך לתמוך במספר נמענים מופרדים בפסיקים — קלוד יפרק. |
| `subject`                     | string   | ✅   | נושא המייל. דו-לשוני (עברית + ערבית) כברירת מחדל, ניתן לעריכה ע"י הסוכן. |
| `body`                        | string   | ✅   | גוף המייל ב-**plain text** עם `\n` כשבירת שורה. משמש כ-fallback ללקוחות מייל ישנים שלא תומכים ב-HTML. |
| `bodyHtml`                    | string   | ✅   | גוף המייל ב-**HTML מלא ומעוצב** (כולל `<!DOCTYPE>`, `<html lang dir>`, `<body dir>`, inline styles). מוכן לשליחה ישירה כ-`text/html`. ה-HTML כבר כולל RTL לעברית/ערבית, header עם הלוגו הטקסטואלי "מי עירון / مياه عيرون", body מעוצב, ו-footer. URLs בתוכן הומרו אוטומטית ל-`<a>` clickable. |
| `contentType`                 | string   | ✅   | תמיד `"text/html"`. רומז לקלוד באיזה Content-Type לשלוח את המייל בפועל (multipart/alternative עם שני הגרסאות = best practice). |
| `language`                    | string   | ✅   | קוד שפה: `"he"` / `"ar"` / `"en"`. נקבע לפי שפת ה-UI שנבחרה ע"י הסוכן בעת השליחה. |
| `direction`                   | string   | ✅   | `"rtl"` עבור he/ar, `"ltr"` עבור en. מופיע גם בתוך ה-`bodyHtml` בתגיות `<html dir>` ו-`<body dir>`. |
| `metadata`                    | object   | ✅   | מטא-דאטה לוגיסטית לתיעוד/לוגים. אינפורמטיבית בלבד — אין צורך לשלב בגוף המייל (ה-HTML כבר כולל את כל מה שצריך). |
| `metadata.lookupCode`         | string   | ✅   | קוד הפנייה במערכת מי עירון. |
| `metadata.phoneNumber`        | string   | ⬜   | טלפון הלקוח (יכול להיות ריק). |
| `metadata.customerCity`       | string   | ⬜   | עיר הלקוח. |
| `metadata.formUrl`            | string   | ⬜   | קישור לטופס המקורי. |
| `metadata.attachedFormLink`   | boolean  | ✅   | האם הסוכן בחר לצרף את הקישור (כבר משובץ ב-`body` וב-`bodyHtml`). |
| `metadata.insertDate`         | string   | ⬜   | חותמת זמן יצירת הפנייה (ISO 8601). |

### תגובה מצופה מהשרת
**הצלחה (200/201):**
```json
{ "success": true, "messageId": "<optional>" }
```

**שגיאה (400/401/403/500):**
```json
{ "success": false, "error": "תיאור השגיאה" }
```

הלקוח בודק רק את `response.ok`. אם תרצה הודעה ידידותית יותר, החזר JSON עם `message` או `error`.

### המלצה לשליחה בצד-השרת
שלח את המייל כ-`multipart/alternative` עם שתי גרסאות:
1. `text/plain; charset=utf-8` ← הערך של `body`
2. `text/html; charset=utf-8` ← הערך של `bodyHtml` (מוכן לשליחה כמו שהוא, כולל RTL)

ה-`bodyHtml` כבר כולל `dir="rtl"` ב-`<html>` וב-`<body>`, charset, viewport meta, ו-inline styles — אין צורך לעטוף אותו שוב.

### דרישות פונקציונליות מצד-השרת
1. **אימות הטוקן** — לקרוא את `x-api-key` (או `access-token` כ-fallback), לאמת מול אותה מערכת אימות שמשמשת את שאר ה-WCP endpoints.
2. **בדיקת realm** — לוודא ש-`realm: meieiron`.
3. **שליחת המייל** — באמצעות שירות SMTP/Mailgun/וכו' של הצד שלך, מהכתובת הרשמית של מי עירון. ה-body הוא plain text עם שבירות שורה — מומלץ לעטוף ב-`<pre>` או להמיר `\n`→`<br>` ב-HTML, או לשלוח כ-`text/plain`.
4. **כיוון טקסט (RTL)** — אם שולחים HTML, להוסיף `dir="rtl"` ב-wrapper, גם עברית וגם ערבית RTL.
5. **From / Reply-To** — כתובת שולח רשמית של מי עירון (להגדיר בצד-השרת, לא נשלח מהלקוח).
6. **תיעוד** — לשמור את ה-`metadata` בלוג כדי שאפשר יהיה לעקוב איזה סוכן שלח איזה מייל לאיזו פנייה.
7. **אין צורך ב-attachments** — הקישור לטופס נשלח כטקסט ב-body.

### דוגמת cURL לבדיקה
```bash
curl -X POST 'https://testapis-pb.api-connect.co.il/WCP/sendCBemail' \
  -H 'Content-Type: application/json' \
  -H 'realm: meieiron' \
  -H 'x-api-key: <TOKEN>' \
  -H 'access-token: <TOKEN>' \
  -d '{
    "to": "test@example.com",
    "subject": "פנייה ABC123 / استفسار ABC123",
    "body": "שלום,\n\nבדיקה.\n\n— — —\n\nالسلام عليكم،\n\nاختبار.",
    "metadata": {
      "lookupCode": "ABC123",
      "phoneNumber": "0501234567",
      "customerCity": "כפר קרע",
      "formUrl": "https://example.com/form/ABC123",
      "attachedFormLink": false,
      "insertDate": "2026-04-21T13:48:28.000Z"
    }
  }'
```

---

## חלק 2 — שינוי בצד הלקוח

**קובץ:** `src/components/dashboard/ScreenShareTab.tsx` (ב-`handleSendEmail`, סביב שורה 178)

**מה משתנה:** מוסיפים header `access-token` לבקשת ה-POST של `sendCBemail`, בנוסף ל-`x-api-key` הקיים — כדי להתאים לתבנית שמופיעה בשאר ה-WCP endpoints (`getWaitingVisitors`, `getOnlineVisitors`) שמשתמשים ב-`access-token`. ערך זהה לטוקן.

**לפני:**
```ts
headers: {
  'Content-Type': 'application/json',
  'x-api-key': token,
  realm: 'meieiron',
},
```

**אחרי:**
```ts
headers: {
  'Content-Type': 'application/json',
  realm: 'meieiron',
  'x-api-key': token,
  'access-token': token,
},
```

זה נותן לקלוד גמישות לקרוא את הטוקן מאיזה header שנוח לו, בלי לשבור שום דבר אחר.

---

## מה לא משתנה
- מבנה ה-payload (`to`, `subject`, `body`, `metadata`) נשאר כמו שהוא.
- הטקסטים הדו-לשוניים (עברית + ערבית) נשארים כמו שהם.
- שאר ה-API באתר (login, OTP, getWaitingVisitors, watch_url) — לא נוגעים.
