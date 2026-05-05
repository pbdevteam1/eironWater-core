## מטרה
לאפשר הגשת האפליקציה תחת `https://eironwater.pb-digital.co.il/eironwater/` בלי לפגוע באפליקציה `nagixAI` הקיימת בשרת.

## רקע טכני
האפליקציה היא Vite + React + React Router (`BrowserRouter`). כברירת מחדל, Vite בונה לנכסים ב-`/` והראוטר מאזין משורש הדומיין. כדי לרוץ תחת `/eironwater/` יש לעדכן את ה-base גם ב-build וגם ב-router, וכן לטפל ב-SPA fallback בשרת.

## שינויים בקוד

### 1. `vite.config.ts` — הוספת `base`
```ts
export default defineConfig(({ mode }) => ({
  base: "/eironwater/",
  // ...שאר ההגדרות
}));
```
זה יגרום לכל הנכסים (`/eironwater/assets/...`) להיטען מהנתיב הנכון.

### 2. `src/App.tsx` — `basename` ל-Router
```tsx
<BrowserRouter basename="/eironwater">
```
כדי שהראוטר יבין שהשורש הוא `/eironwater/`.

### 3. `index.html` — favicon וקישורים יחסיים
החלפת `href="/meiah-logo.png"` ל-`href="./meiah-logo.png"` (או `/eironwater/meiah-logo.png`) כדי שהאייקון ייטען נכון.

### 4. בדיקה של שימושים בנתיבים מוחלטים בקוד
חיפוש שימושים מוחלטים כמו `src="/..."` או `fetch("/...")` והתאמתם ל-`import.meta.env.BASE_URL`. (אעבור על הקוד ואעדכן במידת הצורך.)

## הוראות פריסה ב-VPS (Nginx)

לאחר `npm run build`, תיקיית `dist/` תכיל את האפליקציה. יש להעלותה לתיקייה ייעודית בשרת, לדוגמה `/var/www/eironwater/`.

הוספת `location` block לקובץ ה-Nginx של הדומיין `eironwater.pb-digital.co.il` (לא נוגעים בהגדרות של `nagixai`):

```nginx
location /eironwater/ {
    alias /var/www/eironwater/;
    try_files $uri $uri/ /eironwater/index.html;
}
```

`try_files` עם fallback ל-`index.html` — זה ה-SPA fallback שמאפשר ל-React Router לטפל ברענון דף או deep links.

## אימות שלא נפגעת האפליקציה הקיימת
- האפליקציה החדשה היושבת על דומיין/נתיב נפרד (`eironwater/`) ולא תחת `nagixAI/`.
- אין שינוי בקבצי הקונפיג של `nagixai` — רק הוספת `location` חדש.
- מומלץ להריץ `nginx -t` לפני `nginx -s reload` כדי לוודא שאין שגיאות.

## מה נעשה לאחר אישור
1. עדכון `vite.config.ts` להוספת `base`.
2. עדכון `App.tsx` להוספת `basename`.
3. עדכון `index.html` ליחסיות נכסים.
4. סריקת הקוד והחלפת נתיבים מוחלטים שעלולים להישבר.
5. אספק לך קובץ הגדרות Nginx מוכן והוראות פריסה צעד-צעד.
