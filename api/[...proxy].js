const http = require('http');
const https = require('https');
const { URL } = require('url');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const ALLOWED_PATHS = new Set(['/qr', '/status']);

const setCorsHeaders = (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
};

module.exports = (req, res) => {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        return res.end();
    }

    const relativePath = req.url.replace(/^\/api/, '') || '/';
    const targetUrl = new URL(relativePath, BACKEND_URL);

    if (!ALLOWED_PATHS.has(targetUrl.pathname)) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'Not Found' }));
    }

    const httpModule = targetUrl.protocol === 'https:' ? https : http;

    const options = {
        hostname: targetUrl.hostname,
        port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
        path: targetUrl.pathname + targetUrl.search,
        method: req.method,
        headers: {
            ...req.headers,
            host: targetUrl.hostname,
        },
    };

    const proxyReq = httpModule.request(options, (proxyRes) => {
        const headers = {
            ...proxyRes.headers,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Accept',
        };

        res.writeHead(proxyRes.statusCode || 500, headers);
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (error) => {
        console.error('[API PROXY ERROR]', error);
        res.statusCode = 502;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Proxy error', details: error.message }));
    });

    req.pipe(proxyReq);
};
