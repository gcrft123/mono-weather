// Ambient Weather API proxy as a Cloudflare Worker.
//
// Same job as netlify/functions/ambient.mjs, but host-independent and on
// Cloudflare's free tier (100k req/day). Because the Worker runs on a
// *different* origin than the app (foo.workers.dev), it MUST return CORS
// headers — unlike the same-origin Netlify Function. That also lets it serve
// file:// and plain static deployments, so it can replace the corsproxy.io
// fallback entirely.
//
// Point the app at it via Settings → Ambient → Proxy URL, e.g.
//   https://mono-weather-ambient.<your-subdomain>.workers.dev
//
// The app builds same-origin/absolute paths from the upstream URL, so it
// requests /v1/devices and /v1/devices/:mac directly (see index.html:3720).
// We also accept the Netlify-style /api/devices alias for parity.

const UPSTREAM = 'https://rt.ambientweather.net';
const ALLOWED_PREFIX = '/v1/devices';

// Only these origins may use the Worker from a browser. 'null' covers file://
// and other opaque origins (the app's local/static fallback). Add a custom
// domain here if you point one at the Netlify site.
const ALLOWED_ORIGINS = new Set([
    'https://monow.netlify.app',
    'null'
]);

function corsHeaders(req) {
    const origin = req.headers.get('origin');
    const headers = {
        'access-control-allow-methods': 'GET, OPTIONS',
        'access-control-allow-headers': '*',
        'access-control-max-age': '86400',
        vary: 'Origin'
    };
    if (origin && ALLOWED_ORIGINS.has(origin)) {
        headers['access-control-allow-origin'] = origin;
    }
    return headers;
}

export default {
    async fetch(req) {
        const CORS = corsHeaders(req);

        if (req.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: CORS });
        }
        if (req.method !== 'GET') {
            return json({ error: 'Method not allowed' }, 405, CORS);
        }

        const url = new URL(req.url);

        // Accept the Netlify-style /api/devices[/:mac] alias too.
        const path = url.pathname.replace(/^\/api\/devices/, '/v1/devices');
        if (!path.startsWith(ALLOWED_PREFIX)) {
            return json({ error: 'Not found' }, 404, CORS);
        }

        const applicationKey = url.searchParams.get('applicationKey');
        const apiKey = url.searchParams.get('apiKey');
        if (!applicationKey || !apiKey) {
            return json({ error: 'Missing applicationKey or apiKey' }, 400, CORS);
        }

        // url.search already carries applicationKey/apiKey/limit/endDate.
        const target = `${UPSTREAM}${path}${url.search}`;

        try {
            const upstream = await fetch(target);
            const body = await upstream.text();
            return new Response(body, {
                status: upstream.status,
                headers: {
                    'content-type':
                        upstream.headers.get('content-type') || 'application/json',
                    ...CORS
                }
            });
        } catch (err) {
            return json({ error: 'Proxy request failed', details: err.message }, 500, CORS);
        }
    }
};

function json(obj, status, cors) {
    return new Response(JSON.stringify(obj), {
        status,
        headers: { 'content-type': 'application/json', ...cors }
    });
}
