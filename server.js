/**
 * Teleprompter Pro - WebSocket Server
 * 
 * 提供：
 * 1. 靜態檔案服務 (index.html, remote.html 等)
 * 2. WebSocket 伺服器 (遙控指令中轉)
 * 3. QR Code 生成
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const QRCode = require('qrcode');
const os = require('os');

const PORT = process.env.PORT || 3000;

// --- MIME Types ---
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

// --- Get Local IP ---
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const localIP = getLocalIP();

// --- HTTP Server (Static Files) ---
const server = http.createServer(async (req, res) => {
    let filePath = req.url === '/' ? '/index.html' : req.url;

    // API: Generate QR Code
    if (filePath === '/api/qrcode') {
        try {
            // 優先使用請求的 Host header (支援雲端部署)
            const host = req.headers.host;
            const protocol = req.headers['x-forwarded-proto'] || 'http';

            // 如果是雲端部署 (非本地 IP/localhost)，使用請求的 Host
            let remoteUrl;
            if (host && !host.includes('localhost') && !host.match(/^\d+\.\d+\.\d+\.\d+/)) {
                remoteUrl = `${protocol}://${host}/remote.html`;
            } else {
                // 本地開發環境使用本地 IP
                remoteUrl = `http://${localIP}:${PORT}/remote.html`;
            }

            const qrDataUrl = await QRCode.toDataURL(remoteUrl, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                qrcode: qrDataUrl,
                url: remoteUrl,
                ip: host || localIP,
                port: PORT
            }));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to generate QR code' }));
        }
        return;
    }

    // Serve static files
    filePath = path.join(__dirname, filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('500 Internal Server Error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

// --- WebSocket Server ---
const wss = new WebSocketServer({ server });

// Store connected clients
const clients = {
    teleprompter: null,  // Main teleprompter display
    remotes: new Set()   // Remote controllers
};

// Current state (synced between clients)
let currentState = {
    isPlaying: false,
    isImmersive: false,
    speed: 3,
    text: ''
};

wss.on('connection', (ws, req) => {
    const urlParams = new URL(req.url, `http://${req.headers.host}`).searchParams;
    const clientType = urlParams.get('type') || 'remote';

    console.log(`Client connected: ${clientType}`);

    if (clientType === 'teleprompter') {
        clients.teleprompter = ws;
        // Send current state to new teleprompter
        ws.send(JSON.stringify({ type: 'state', data: currentState }));
    } else {
        clients.remotes.add(ws);
        // Send current state to new remote
        ws.send(JSON.stringify({ type: 'state', data: currentState }));
    }

    ws.on('message', (message) => {
        try {
            const msg = JSON.parse(message.toString());
            console.log(`Message from ${clientType}:`, msg);

            switch (msg.type) {
                case 'command':
                    // Forward command to teleprompter
                    if (clients.teleprompter && clients.teleprompter.readyState === 1) {
                        clients.teleprompter.send(JSON.stringify(msg));
                    }
                    break;

                case 'state':
                    // Update and broadcast state
                    currentState = { ...currentState, ...msg.data };
                    broadcastState();
                    break;

                case 'text':
                    // Text update from remote
                    currentState.text = msg.data;
                    // Forward to teleprompter
                    if (clients.teleprompter && clients.teleprompter.readyState === 1) {
                        clients.teleprompter.send(JSON.stringify({ type: 'text', data: msg.data }));
                    }
                    // Broadcast to other remotes
                    broadcastToRemotes({ type: 'text', data: msg.data }, ws);
                    break;
            }
        } catch (err) {
            console.error('Invalid message:', err);
        }
    });

    ws.on('close', () => {
        console.log(`Client disconnected: ${clientType}`);
        if (clientType === 'teleprompter') {
            clients.teleprompter = null;
        } else {
            clients.remotes.delete(ws);
        }
    });

    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
    });
});

function broadcastState() {
    const msg = JSON.stringify({ type: 'state', data: currentState });

    if (clients.teleprompter && clients.teleprompter.readyState === 1) {
        clients.teleprompter.send(msg);
    }

    clients.remotes.forEach(client => {
        if (client.readyState === 1) {
            client.send(msg);
        }
    });
}

function broadcastToRemotes(msg, excludeClient = null) {
    const msgStr = JSON.stringify(msg);
    clients.remotes.forEach(client => {
        if (client !== excludeClient && client.readyState === 1) {
            client.send(msgStr);
        }
    });
}

// --- Start Server ---
server.listen(PORT, () => {
    console.log('\n========================================');
    console.log('   提詞器 Teleprompter Pro 伺服器');
    console.log('========================================\n');
    console.log(`📺 提詞器網址: http://localhost:${PORT}`);
    console.log(`📱 遙控器網址: http://${localIP}:${PORT}/remote.html`);
    console.log('\n掃描 QR Code 或在手機輸入上方網址連線');
    console.log('----------------------------------------\n');
});
