# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project layout

MonoWeather is a single-page weather app shipped as one monolithic file (`index.html`, ~7.5k lines) plus an optional Node proxy. There is no build step, bundler, test suite, or linter — edits to `index.html` are live on reload.

- `index.html` — entire app: markup, CSS, and all JS (~1100 functions) inline in one `<script>` starting around line 1386. Tailwind, Leaflet, Firebase, and weather-icons load from CDNs.
- `netlify/functions/ambient.mjs` — Netlify Function (Functions 2.0) that proxies the Ambient Weather REST API. Served same-origin at `/api/devices` and `/api/devices/:mac` via the `config.path` export. This is what the deployed app uses by default.
- `proxy/server.js` — legacy Express version of the same proxy on port 3001. Kept for local dev when running outside Netlify; not used in production.

## Running

- App only: open `index.html` directly in a browser, or serve the repo root with any static server. No build.
- App + Ambient proxy together (recommended for Ambient work): `npx netlify dev` from the repo root — serves the static site and the Netlify Function at `localhost:8888`, mirroring production.
- Legacy Express proxy: `cd proxy && npm install && npm start` (port 3001). Only needed if you're not running `netlify dev`.

## Architecture

### Single global `state` object
Defined around line 1447. Holds UI prefs (unit/windSpeedUnit/pressureUnit/timeFormat/theme/accent), the active `provider`, an `ambient` sub-object (creds, deviceMac, proxyUrl, devices, lastData, history, forecastCity), `weatherData`, `cityData`, and a `radar` sub-object (Leaflet map, RainViewer frames, timeline scrub state, temperature overlay). Most functions read/write `state` directly — no framework, no reactive store.

### Two data providers
- `openmeteo` (default) — `api.open-meteo.com` for forecast + current, `geocoding-api.open-meteo.com` for city search. No auth.
- `ambient` (opt-in, requires sign-in) — Ambient Weather API, reached through `state.ambient.proxyUrl`. Default is `/` so calls go same-origin to the Netlify Function at `/api/devices[/:mac]`. The code also supports a prefix-proxy shape: a URL ending in `?` is concatenated with the full upstream Ambient URL (e.g. `corsproxy.io/?` + `https://rt.ambientweather.net/v1/...`). See `index.html:3679` and `index.html:3722`. A one-time migration at `index.html:1442` rewrites legacy `https://corsproxy.io/?` stored values to `/`.

When Ambient is active, forecast/radar still come from Open-Meteo against `state.ambient.forecastCity` — Ambient only feeds current conditions and history.

### Persistence (three layers, written together)
`readStore(key, fallback)` reads cookies first, then localStorage. `persistStore(key, value)` writes localStorage + a 365-day cookie, then schedules a `window.cloudSync._schedulePush()` if cloud sync is initialized. All app keys are prefixed `mw_*` (e.g. `mw_unit`, `mw_provider`, `mw_ambient_apikey`, `mw_ambient_forecast_city`). When adding a new persisted setting, route it through `persistStore`/`readStore` so it picks up cookie + cloud sync automatically.

### Optional Firebase cloud sync
`window.MONO_FIREBASE_CONFIG` is hard-coded at the top of the `<script>` (it's a public web-app config — secrets live in Firestore rules, not here). Auth + Firestore are loaded via `firebase-*-compat` defer scripts in `<head>`. The sync layer (`loadFirebaseCompat` / `initFirebase` around line 1605–1820) snapshots all `mw_*` values into a single Firestore doc per user, restores on login, and clears Ambient state on sign-out to prevent cross-account leaks (line 1750+).

### Pages and navigation
Four `<section>`s inside `#page-container`: WEATHER (0), RADAR (1), SETTINGS (2), INFO (3) — search for `PAGE 0:` etc. A custom slider (vertical on desktop, horizontal bottom bar on mobile) drives `setPage(index)`. Drag handling has separate touch/mouse paths (`onDragTouch`/`onDrag`).

### Radar
Leaflet map with two tile layers: RainViewer precipitation frames (fetched from `api.rainviewer.com/public/weather-maps.json`) and an Open-Meteo-sampled temperature grid. Frames are minute-scrubbed via `state.radar.{minTimeSec, maxTimeSec, selectedTimeSec}`; tile layers are double-buffered (`rainviewer` + `rainviewerPending`) to avoid flashes on frame swap.

## Design system

`DESIGN.md` at the repo root is the source of truth for visual design — color tokens, typography scale, border widths, component patterns (cards, buttons, inputs, modals), chart palette, iconography. **Read it before adding or modifying any UI, and follow it.** If a deliberate exception is needed, update `DESIGN.md` in the same change so the rule and its carve-out land together.

In short: monospace brutalism — `'Space Mono'` only, `font-bold` default, `tracking-widest` UPPERCASE for labels, `border-4` outlines on cards/buttons/inputs, sharp corners (no `rounded-*` except `rounded-full` for circular UI), hard offset shadows (`Npx Npx 0px ...`), CSS variables (`--accent-color`, `--text-color`, etc.) for anything that themes. Per-metric chart colors live in §6 of `DESIGN.md` — use those hex values, not `rgb()`/`rgba()`, for solid colors.

## Working in this codebase

- The file is large but flat — `grep -n` for a function name or DOM id is the fastest way to navigate. Element refs are cached on a global `els` object built in `init()` (line 1982+).
- Don't introduce a build step, framework, or split files unless the user asks — the single-file shape is intentional.
- When touching settings UI, also update the cloud-sync snapshot list (search for `mw_ambient_appkey` in the snapshot block near line 1805) so the new key round-trips through Firestore.
- The Firebase web-app config in the source is intentionally committed; do not treat it as a leaked secret.
