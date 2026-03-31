# FTP deployment guide

This project can be prepared for FTP upload with:

```bash
npm run build:ftp
```

That command:
1. builds the app into `dist/`
2. copies `deploy/.htaccess` into `dist/.htaccess` (SPA routing support)

## Upload steps

1. Run `npm run build:ftp` locally.
2. Open your FTP client (e.g. FileZilla / WinSCP).
3. Connect to your hosting FTP server.
4. Go to your web root (often `public_html` or `www`).
5. Upload **all files and folders from `dist/`** into web root.
6. Ensure `.htaccess` is uploaded too (show hidden files in FTP client).

## Important notes

- If your app is hosted in a subfolder (e.g. `https://example.com/heatmap/`), set Vite `base` in `vite.config.js` accordingly.
- After upload, hard-refresh browser (`Ctrl+F5`) to clear cached JS/CSS.
