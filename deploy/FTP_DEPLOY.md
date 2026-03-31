# FTP deployment guide

Do not open `dist/index.html` directly from disk (`file://...`) — Vite bundles are meant to run from HTTP(S) hosting.

## Build for FTP

### If your app is hosted at domain root (e.g. `https://example.com/`)

```bash
npm run build:ftp
```

### If your app is hosted in a subfolder (e.g. `https://melichar.sk/heat_map/`)

Windows CMD:

```cmd
set FTP_BASE_PATH=/heat_map/ && npm run build:ftp
```

PowerShell:

```powershell
$env:FTP_BASE_PATH='/heat_map/'; npm run build:ftp
```

That command:
1. runs `vite build --base <FTP_BASE_PATH>`
2. copies `deploy/.htaccess` into `dist/.htaccess` (SPA routing support)

## Upload steps

1. Open your FTP client (FileZilla / WinSCP).
2. Connect to your hosting FTP server.
3. Go to your target web folder (for this case: `heat_map`).
4. Upload **all files and folders from `dist/`** into that folder.
5. Ensure `.htaccess` is uploaded too (show hidden files in FTP client).

## Quick verification

- Visit exactly: `https://melichar.sk/heat_map/`
- Hard refresh (`Ctrl+F5`).
- Open browser DevTools → Network and confirm JS/CSS files load from `/heat_map/assets/...` (not from `/assets/...`).
