## הסרת אייקון Lovable מטאב הדפדפן

כרגע `public/favicon.ico` הוא ברירת המחדל של Lovable, ולכן הוא מופיע בלשונית הדפדפן.

### שינויים

1. **`index.html`** — להוסיף בתוך `<head>` קישור favicon ללוגו של מי עירון:
   ```html
   <link rel="icon" type="image/png" href="/meiah-logo.png" />
   <link rel="apple-touch-icon" href="/meiah-logo.png" />
   ```

2. **`public/meiah-logo.png`** — להעתיק את `src/assets/meiah-logo.png` לתיקיית `public/` כדי שיהיה נגיש כקובץ סטטי בנתיב `/meiah-logo.png`.

3. **`public/favicon.ico`** — למחוק את הקובץ הקיים (האייקון של Lovable) כדי שהדפדפן לא ייפול חזרה אליו.

תוצאה: בלשונית הדפדפן יוצג הלוגו של מי עירון במקום האייקון של Lovable.