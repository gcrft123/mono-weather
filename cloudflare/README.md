# Cloudflare Worker — Ambient Weather proxy

A host-independent, free alternative to the Netlify Function in
`netlify/functions/ambient.mjs`. Use it as a backup proxy (or to drop the
`corsproxy.io` fallback), without tying the app to Netlify.

- **Free tier:** 100,000 requests/day, global edge, no cold-start sleep.
- **No build step, no secrets.** The app sends the Ambient `applicationKey`
  and `apiKey` as query params on each request.
- Returns CORS headers, so it works cross-origin **and** from `file://` /
  plain static hosts — unlike the same-origin Netlify Function.
- CORS is **locked to an allowlist** (`ALLOWED_ORIGINS` in `worker.js`):
  `https://monow.netlify.app` and `null` (file://). Add your custom domain
  there if you point one at the site, then redeploy.

## Deploy

```sh
cd cloudflare
npx wrangler login      # one-time, opens a browser
npx wrangler deploy
```

`wrangler deploy` prints the live URL, e.g.
`https://mono-weather-ambient.<your-subdomain>.workers.dev`.

## Point the app at it

In the app: **Settings → Ambient → Proxy URL**, set it to the Worker URL above
(no trailing slash needed). The app appends `/v1/devices[/:mac]` itself, so
just the origin is enough. Leave it as `/` to keep using the Netlify Function.

## Routes

| Request to the Worker            | Forwarded to Ambient                          |
| -------------------------------- | --------------------------------------------- |
| `GET /v1/devices?...`            | `https://rt.ambientweather.net/v1/devices`    |
| `GET /v1/devices/:mac?...`       | `.../v1/devices/:mac`                          |
| `GET /api/devices[/:mac]?...`    | same as above (Netlify-style alias)           |

Requires `applicationKey` and `apiKey` query params; everything else is
rejected, so it can't be used as an open proxy.
