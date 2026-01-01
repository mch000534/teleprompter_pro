/**
 * Teleprompter Remote Control Logic
 */

// --- State ---
const RemoteState = {
    isConnected: false,
    isPlaying: false,
    isImmersive: false,  // 追蹤全屏狀態
    speed: 3,
    text: ''
};

// --- WebSocket Connection ---
let ws = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 2000;

// --- NoSleep 防止手機休眠 ---
let noSleep = null;
if (typeof NoSleep !== 'undefined') {
    noSleep = new NoSleep();
}

function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}?type=remote`;

    console.log('Connecting to:', wsUrl);

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('WebSocket connected');
        RemoteState.isConnected = true;
        reconnectAttempts = 0;
        updateConnectionStatus(true);
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected');
        RemoteState.isConnected = false;
        updateConnectionStatus(false);

        // Attempt reconnection
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            console.log(`Reconnecting... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
            setTimeout(connectWebSocket, RECONNECT_DELAY);
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    ws.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data);
            handleServerMessage(msg);
        } catch (err) {
            console.error('Invalid message:', err);
        }
    };
}

function handleServerMessage(msg) {
    switch (msg.type) {
        case 'state':
            // Update local state
            if (msg.data.isPlaying !== undefined) {
                RemoteState.isPlaying = msg.data.isPlaying;
            }
            if (msg.data.isImmersive !== undefined) {
                RemoteState.isImmersive = msg.data.isImmersive;
            }
            if (msg.data.speed !== undefined) {
                RemoteState.speed = msg.data.speed;
            }
            if (msg.data.text !== undefined) {
                RemoteState.text = msg.data.text;
                // Update textarea if not focused
                const editor = document.getElementById('textEditor');
                if (document.activeElement !== editor) {
                    editor.value = msg.data.text;
                }
            }
            updateUI();
            break;

        case 'text':
            // Text update from teleprompter
            RemoteState.text = msg.data;
            const editor = document.getElementById('textEditor');
            if (document.activeElement !== editor) {
                editor.value = msg.data;
            }
            break;
    }
}

function sendCommand(command, value = null) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        const msg = {
            type: 'command',
            command: command,
            value: value
        };
        ws.send(JSON.stringify(msg));
    }
}

function sendText(text) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'text',
            data: text
        }));
    }
}

// --- UI Updates ---
function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('connectionStatus');
    const dotEl = statusEl.querySelector('.status-dot');
    const textEl = statusEl.querySelector('.status-text');

    if (connected) {
        statusEl.classList.add('connected');
        statusEl.classList.remove('disconnected');
        textEl.textContent = '已連線';
    } else {
        statusEl.classList.remove('connected');
        statusEl.classList.add('disconnected');
        textEl.textContent = '未連線';
    }
}

function updateUI() {
    // Update play status
    const playStatusEl = document.getElementById('playStatus');
    const playPauseIcon = document.getElementById('playPauseIcon');
    const playPauseLabel = document.getElementById('playPauseLabel');

    if (RemoteState.isPlaying) {
        playStatusEl.textContent = '播放中';
        playStatusEl.classList.add('playing');
        playStatusEl.classList.remove('paused');
        playPauseIcon.textContent = '⏸';
        playPauseLabel.textContent = '暫停';
    } else if (RemoteState.isImmersive) {
        // 全屏但暫停中
        playStatusEl.textContent = '已暫停';
        playStatusEl.classList.remove('playing');
        playStatusEl.classList.add('paused');
        playPauseIcon.textContent = '▶';
        playPauseLabel.textContent = '繼續';
    } else {
        playStatusEl.textContent = '已停止';
        playStatusEl.classList.remove('playing');
        playStatusEl.classList.remove('paused');
        playPauseIcon.textContent = '▶';
        playPauseLabel.textContent = '播放';
    }

    // Update speed
    document.getElementById('speedStatus').textContent = RemoteState.speed;
    document.getElementById('speedValue').textContent = RemoteState.speed;
}

// --- Event Listeners ---
function initEvents() {
    // Play/Pause
    document.getElementById('btnPlayPause').addEventListener('click', () => {
        sendCommand(RemoteState.isPlaying ? 'pause' : 'play');
    });

    // Stop
    document.getElementById('btnStop').addEventListener('click', () => {
        sendCommand('stop');
    });

    // Speed Up
    document.getElementById('btnSpeedUp').addEventListener('click', () => {
        const newSpeed = Math.min(100, RemoteState.speed + 5);
        sendCommand('speed', newSpeed);
    });

    // Speed Down
    document.getElementById('btnSpeedDown').addEventListener('click', () => {
        const newSpeed = Math.max(0, RemoteState.speed - 5);
        sendCommand('speed', newSpeed);
    });

    // Scroll Up
    document.getElementById('btnScrollUp').addEventListener('click', () => {
        sendCommand('scroll', -100);
    });

    // Scroll Down
    document.getElementById('btnScrollDown').addEventListener('click', () => {
        sendCommand('scroll', 100);
    });

    // Text Editor - Sync Button
    document.getElementById('btnSync').addEventListener('click', () => {
        const text = document.getElementById('textEditor').value;
        sendText(text);

        // Visual feedback
        const btn = document.getElementById('btnSync');
        btn.textContent = '✅ 已同步';
        setTimeout(() => {
            btn.textContent = '🔄 同步';
        }, 1500);
    });

    // Text Editor - Real-time sync (debounced)
    let textSyncTimeout = null;
    document.getElementById('textEditor').addEventListener('input', (e) => {
        clearTimeout(textSyncTimeout);
        textSyncTimeout = setTimeout(() => {
            sendText(e.target.value);
        }, 500); // Debounce 500ms
    });

    // Prevent zoom on double tap
    document.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });

    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });
}

// --- Initialization ---
function init() {
    initEvents();
    connectWebSocket();
    updateUI();

    // 頁面載入時就啟用 NoSleep 防止手機休眠
    if (noSleep) {
        // 需要用戶互動才能啟用，監聽第一次觸控
        document.addEventListener('touchstart', function enableNoSleep() {
            noSleep.enable();
            document.removeEventListener('touchstart', enableNoSleep);
        }, { once: true });
    }
}

document.addEventListener('DOMContentLoaded', init);
