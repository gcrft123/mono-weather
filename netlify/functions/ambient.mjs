// Ambient Weather API proxy as a Netlify Function (Functions 2.0).
// Mirrors proxy/server.js but runs same-origin on Netlify, so no CORS.
//
// Routes (declared via the `config.path` export below):
//   GET /api/devices?applicationKey=...&apiKey=...
//   GET /api/devices/:mac?applicationKey=...&apiKey=...&limit=...&endDate=...

export default async (req) => {
    const url = new URL(req.url);
    const applicationKey = url.searchParams.get('applicationKey');
    const apiKey = url.searchParams.get('apiKey');

    if (!applicationKey || !apiKey) {
        return Response.json(
            { error: 'Missing applicationKey or apiKey' },
            { status: 400 }
        );
    }

    // pathname is percent-encoded; decode the mac segment before re-encoding.
    const segments = url.pathname.replace(/^\/+/, '').split('/');
    const macRaw = segments[2];
    const mac = macRaw ? decodeURIComponent(macRaw) : null;

    const base = 'https://rt.ambientweather.net/v1/devices';
    const params = new URLSearchParams();
    params.set('applicationKey', applicationKey);
    params.set('apiKey', apiKey);
    const limit = url.searchParams.get('limit');
    const endDate = url.searchParams.get('endDate');
    if (limit) params.set('limit', limit);
    if (endDate) params.set('endDate', endDate);

    const target = mac
        ? `${base}/${encodeURIComponent(mac)}?${params}`
        : `${base}?${params}`;

    try {
        const upstream = await fetch(target);
        const body = await upstream.text();
        return new Response(body, {
            status: upstream.status,
            headers: {
                'content-type': upstream.headers.get('content-type') || 'application/json'
            }
        });
    } catch (err) {
        return Response.json(
            { error: 'Proxy request failed', details: err.message },
            { status: 500 }
        );
    }
};

export const config = {
    path: ['/api/devices', '/api/devices/*']
};
