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
  "body": "שלום,\n\nבהמשך לפנייתך באתר מי עירון...\n\n— — —\n\nالسلام عليكم،\n\nتكملةً لاستفساركم...\n\n— — —\n\nקישור לטופס: https://...\nرابط النموذج: https://...",
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
| `to`                          | string   | ✅   | כתובת מייל יחידה של הנמען. **הערה**: כרגע הלקוח שולח את `emails` כמחרוזת בודדת. אם בעתיד יהיה צורך לתמוך במספר נמענים מופרדים בפסיקים — קלוד צריך לפרק. |
| `subject`                     | string   | ✅   | נושא המייל. דו-לשוני (עברית + ערבית) כברירת מחדל, ניתן לעריכה ע"י הסוכן. |
| `body`                        | string   | ✅   | גוף המייל, plain text עם `\n` כשבירת שורה. דו-לשוני. אם הסוכן סימן "צרף קישור", הלקוח כבר מוסיף את שורות הקישור לפני השליחה — קלוד **לא** צריך להוסיף שוב. |
| `metadata`                    | object   | ✅   | מטא-דאטה לוגיסטית לתיעוד/לוגים. השדות אינפורמטיביים בלבד — אין צורך לשלב אותם בגוף המייל. |
| `metadata.lookupCode`         | string   | ✅   | קוד הפנייה במערכת מי עירון. |
| `metadata.phoneNumber`        | string   | ⬜   | טלפון הלקוח (יכול להיות ריק). |
| `metadata.customerCity`       | string   | ⬜   | עיר הלקוח. |
| `metadata.formUrl`            | string   | ⬜   | קישור לטופס המקורי. |
| `metadata.attachedFormLink`   | boolean  | ✅   | האם הסוכן בחר לצרף את הקישור ל-body. |
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

הלקוח בודק רק את `response.ok` — אם ה-status מחוץ ל-2xx, מציג toast שגיאה עם ה-status code. אם תרצה הודעה ידידותית יותר, החזר JSON עם `message` או `error` ואני אעדכן את הלקוח לקרוא אותו.

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
