For My Forever Valentine — Production Notes

What's included

- `index.html`, `style.css`, `script.js` — the app
- `manifest.json` — PWA manifest
- `sw.js` — simple service worker to cache core assets
- `manifest` icons: add `icon-192.png` and `icon-512.png` to the project for PWA install support

Quick production checklist

1. Supply assets
   - Add `us.png` (the image used for the puzzle).
   - Add `icon-192.png` and `icon-512.png` and an optional `favicon.ico`.

2. Configure webhook
   - Open the page, paste your Google Apps Script Web App URL into the "Phone notification webhook" field and click Save.
   - Optionally use the Test button to send a test notification.

3. Apps Script / Notifications
   - Make sure your Apps Script project `NOTIFY_EMAIL` property is set to your email or SMS gateway address.
   - If using Apps Script and you want CORS-full responses, return `Access-Control-Allow-Origin: *` in the script output.

4. Serve with HTTPS
   - For PWAs and service workers, serve the site over HTTPS (GitHub Pages, Netlify, Vercel, or your own HTTPS server).
   - Example: deploy to GitHub Pages by pushing this folder to a repository and enabling Pages.

5. Optional: Improve reliability
   - Add server-side endpoint (proxy) that accepts POSTs and forwards to Apps Script to avoid CORS issues.
   - Replace client-side webhook prefill with environment-specific config during your build/deploy pipeline.

Local testing

Run a simple static server from the project root:

```powershell
# Windows / PowerShell
python -m http.server 8000
# then open http://localhost:8000 in your browser
```

Deployment

- GitHub Pages: push repo and enable GitHub Pages.
- Netlify / Vercel: drag-and-drop site folder or connect repo.

Security & privacy

- Webhook URLs are stored in `localStorage` (only on your browser). If you deploy publicly and need secret storage, use a server-side approach or encrypted secret store.

Need help deploying to a specific host (GitHub Pages / Netlify)? Tell me which and I'll provide exact steps.
