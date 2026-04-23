

## התאמת קריאת POST ל־watch_url בדומה לגיחון

### מה קורה עכשיו (ולמה זה נכשל)
הקריאה אצלנו פונה ל:
```
POST /WCP/visitors/{unique_id}/watch_url
Headers: access-token, realm: meieiron
Body: כולל short_id, ללא webhook_url
```

בגיחון (העובד) הקריאה היא:
```
POST /cbtest/visitors/{short_id}/watch_url
Headers: x-api-key, realm: hagihon
Body: ללא short_id, כולל webhook_url
```

ההבדלים הקריטיים: שם ה־header (`x-api-key` ולא `access-token`), שימוש ב־`short_id` בנתיב (לא `unique_id`), והוספת `webhook_url` ל־body.

### מה נשנה (קובץ יחיד)

**`src/components/dashboard/ScreenShareTab.tsx`** – פונקציית `handleJoin`:

1. **נתיב**: לשנות מ־`visitors/${visitorId}` ל־`visitors/${v.short_id}/watch_url` (תמיד `short_id`, כמו בגיחון).
2. **Headers**: להחליף `access-token` ל־`x-api-key` (זה ה־header שה־API מצפה לו). `realm` נשאר `meieiron`.
3. **Body**:
   - להסיר את שדה `short_id` (לא נשלח בגיחון – הוא בנתיב).
   - להוסיף `webhook_url` (קבוע: `https://testapis-pb.api-connect.co.il/webhook`).
   - לשנות `language` מ־`'he'` ל־`'en'` כמו בגיחון (אופציונלי – ניתן להשאיר `'he'` אם מועדף).
4. **תוצאה**: קריאת `data.watch_url` תחזיר את הקישור.

### תצוגת הסשן (אופציונלי – שיפור)
בגיחון הסשן נפתח כ־**iframe בתוך הדף** (לא בטאב חדש), עם כפתור הרחבה וכפתור סגירה, וזיהוי אוטומטי של סיום סשן. אם תרצה, אוסיף גם זאת – אבל הצעד הראשון הוא רק לתקן את ה־POST כדי שיעבוד.

### פירוט טכני

```ts
// במקום הפניה ל־visitorId, שימוש ב־short_id:
const res = await fetch(
  `${API_BASE_URL}/WCP/visitors/${v.short_id}/watch_url`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': token,        // היה: 'access-token'
      realm: 'meieiron',
    },
    body: JSON.stringify({
      agent: { id: agentId, name: agentName },
      branding: { naked: true, on_end_url: `${origin}/`, retry_url: `${origin}/` },
      initial_notes: '...',
      metadata: { /* ללא שינוי */ },
      permissions: { /* ללא שינוי */ },
      language: 'he',
      webhook_url: 'https://testapis-pb.api-connect.co.il/webhook', // חדש
    }),
  },
);
```

קובץ ערוך: `src/components/dashboard/ScreenShareTab.tsx` בלבד.

