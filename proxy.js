const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = 8080;
// Suporta tanto ambiente local quanto produção
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

console.log(`🔧 Ambiente: ${BACKEND_URL.includes('localhost') ? 'LOCAL' : 'PRODUÇÃO'}`);

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
    // Se for requisição para API, fazer proxy
    if (req.url.startsWith('/qr') || req.url.startsWith('/status')) {
        console.log(`[PROXY] ${req.method} ${req.url} -> ${BACKEND_URL}${req.url}`);

        // Escolhe http ou https baseado na URL do backend
        const isHttps = BACKEND_URL.startsWith('https://');
        const httpModule = isHttps ? https : http;

        // Parse da URL do backend
        const backendUrl = new URL(BACKEND_URL + req.url);

        const options = {
            hostname: backendUrl.hostname,
            port: backendUrl.port,
            path: backendUrl.pathname + backendUrl.search,
            method: req.method,
            headers: {
                ...req.headers,
                host: backendUrl.hostname, // Override do host header
            },
        };

        const proxyReq = httpModule.request(options, (proxyRes) => {
            // Adicionar headers CORS
            res.writeHead(proxyRes.statusCode, {
                ...proxyRes.headers,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Accept',
            });

            proxyRes.pipe(res);
        });

        proxyReq.on('error', (error) => {
            console.error('[PROXY ERROR]', error);
            res.writeHead(502);
            res.end(JSON.stringify({ error: 'Proxy error', details: error.message }));
        });

        req.pipe(proxyReq);
        return;
    }

    // Se não for API, servir arquivos estáticos
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('404 - File Not Found');
            } else {
                res.writeHead(500);
                res.end('500 - Internal Server Error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`\n🚀 Servidor proxy rodando em http://localhost:${PORT}`);
    console.log(`📡 Backend: ${BACKEND_URL}`);
    console.log(`\n✅ Abra http://localhost:${PORT} no navegador\n`);
});
