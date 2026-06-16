# WARDANY TRIP ENTERPRISE

Production-ready travel management platform. 100% free stack:
**Next.js 15 (Static Export) + Google Apps Script + Google Sheets + Google Drive + Gmail.**

## Architecture

```
frontend/   Next.js 15 PWA (Vercel)  ──POST text/plain──▶  backend/ (GAS Web App /exec)
                                                            │
                                              Google Sheets (24-sheet DB)
                                              Google Drive  (files, receipts, documents, backups)
                                              Gmail         (notifications)
                                              Frankfurter / open.er-api (FX)
```

## Quick Start (3 steps)

1. **Backend** — push `backend/` to Google Apps Script, enable Advanced Drive Service (v2), run `Setup.initialize()`, deploy as Web App (`Anyone`). See `docs/GOOGLE_APPS_SCRIPT_SETUP.md`.
2. **Frontend** — `cp frontend/.env.example frontend/.env.local`, set `NEXT_PUBLIC_GAS_URL` to the `/exec` URL.
3. **Deploy** — push to GitHub, import to Vercel (root: `frontend/`). See `docs/DEPLOYMENT.md`.

## Default Users (seeded by Setup.initialize)

| Username | Role | PIN |
|---|---|---|
| wardany | Owner | 280528 |
| rani | Manager | 280529 |
| family | Family Portal | 280530 |

Change PINs after first login (Settings → Change PIN).

## Features
Dashboard widgets (countdowns, open requests, gifts, budget remaining) · Budget Intelligence (burn rate, forecast, envelopes) · Expenses with snapshot-rate EGP conversion · Receipt OCR scanner · Family request workflow (8 states, request→shopping→expense chain) · Shopping groups + WhatsApp share · Gifts · Packing · Travel Checklist (4 phases) · Contacts Directory (call / WhatsApp) · Quick Notes · Favorite Restaurants & Malls · Currency Calculator · Places map (Leaflet dark) · Journal · Documents vault (30-min secure links) · PDF / Excel / CSV reports · EN + AR (RTL) · Dark Royal Black Luxury theme · Offline-first PWA (IndexedDB queue) · Audit log · Daily backups (14-copy retention).

## Documentation
`docs/INSTALLATION.md` · `docs/GOOGLE_APPS_SCRIPT_SETUP.md` · `docs/DEPLOYMENT.md` · `docs/API_REFERENCE.md` · `docs/USER_MANUAL.md` · `docs/ENVIRONMENT_VARIABLES.md` · `docs/SECURITY.md` · `docs/CHANGELOG.md`
