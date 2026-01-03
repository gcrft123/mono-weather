/**
 * MonoWeather CORS Proxy Server
 * 
 * Simple Express proxy to forward requests to the Ambient Weather API.
 * This avoids CORS issues when making API calls from the browser.
 * 
 * Usage:
 *   cd proxy && npm install && npm start
 * 
 * The proxy runs on http://localhost:3001
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Enable CORS for all origins (localhost development)
app.use(cors());
app.use(express.json());

// Ambient Weather API base URL
const AMBIENT_API_BASE = 'https://rt.ambientweather.net';

/**
 * GET /api/devices
 * Proxy to Ambient Weather /v1/devices endpoint
 * Query params: applicationKey, apiKey
 */
app.get('/api/devices', async (req, res) => {
    const { applicationKey, apiKey } = req.query;
    
    if (!applicationKey || !apiKey) {
        return res.status(400).json({ error: 'Missing applicationKey or apiKey' });
    }

    try {
        const url = `${AMBIENT_API_BASE}/v1/devices?applicationKey=${encodeURIComponent(applicationKey)}&apiKey=${encodeURIComponent(apiKey)}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (!response.ok) {
            return res.status(response.status).json(data);
        }
        
        res.json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Proxy request failed', details: error.message });
    }
});

/**
 * GET /api/devices/:macAddress
 * Proxy to Ambient Weather /v1/devices/{macAddress} endpoint
 * Query params: applicationKey, apiKey, limit (optional), endDate (optional)
 */
app.get('/api/devices/:macAddress', async (req, res) => {
    const { macAddress } = req.params;
    const { applicationKey, apiKey, limit, endDate } = req.query;
    
    if (!applicationKey || !apiKey) {
        return res.status(400).json({ error: 'Missing applicationKey or apiKey' });
    }

    try {
        let url = `${AMBIENT_API_BASE}/v1/devices/${encodeURIComponent(macAddress)}?applicationKey=${encodeURIComponent(applicationKey)}&apiKey=${encodeURIComponent(apiKey)}`;
        
        if (limit) url += `&limit=${encodeURIComponent(limit)}`;
        if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (!response.ok) {
            return res.status(response.status).json(data);
        }
        
        res.json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Proxy request failed', details: error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🌤️  MonoWeather Proxy running at http://localhost:${PORT}`);
    console.log('   Endpoints:');
    console.log('   - GET /api/devices           (list devices)');
    console.log('   - GET /api/devices/:mac      (device data)');
    console.log('   - GET /health                (health check)');
});
