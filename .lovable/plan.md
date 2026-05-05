## מטרה
להחזיר את `shen-i-iron-core.lovable.app` לעבוד, ובמקביל לאפשר build עבור IIS תחת `/eironwater/`.

## שינוי

**`vite.config.ts`** — להחליף את שורת ה-`base`:
```ts
base: process.env.DEPLOY_BASE || "/",
```

זהו. שאר הקבצים (`App.tsx`, `index.html`, `NotFound.tsx`) כבר משתמשים ב-`import.meta.env.BASE_URL` ויתאימו אוטומטית.

## אחרי השינוי

- **Lovable preview / published** → `base = "/"` → האתר יעבוד מיד אחרי republish.
- **Build עבור IIS** (ב-PowerShell על השרת):
  ```powershell
  $env:DEPLOY_BASE="/eironwater/"
  npm run build
  ```
  ואז להעתיק `dist/*` ל-`C:\inetpub\wwwroot\eironwater\`.

## הערה לגבי ה-404 ב-IIS
בהודעה הקודמת ציינתי בעיה אפשרית: אם `eironwater` מוגדר כ-**Application** ב-IIS, ה-rewrite ב-`web.config` צריך להיות `url="index.html"` (יחסי), לא `/eironwater/index.html`. אחרי שנסדר את ה-base, נמשיך לטפל ב-404 של IIS לפי התשובות שלך לבדיקות.
