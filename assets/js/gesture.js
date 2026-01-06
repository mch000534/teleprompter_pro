/**
 * Teleprompter Gesture Control Logic
 */

// --- State ---
const GestureState = {
    isConnected: false,
    isPlaying: false,
    isImmersive: false,
    isReversing: false,
    speed: 3
};

// --- WebSocket Connection ---
let ws = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 2000;

// --- Gesture Detection ---
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
const SWIPE_THRESHOLD = 50;  // 最小滑動距離
const TAP_THRESHOLD = 10;    // 點擊最大移動距離
const TAP_DURATION = 300;    // 點擊最大時間 (ms)

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
        GestureState.isConnected = true;
        reconnectAttempts = 0;
        updateConnectionStatus(true);

        // 進入手勢控制頁面時自動開始播放
        setTimeout(() => {
            sendCommand('play');
        }, 100);
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected');
        GestureState.isConnected = false;
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
            if (msg.data.isPlaying !== undefined) {
                GestureState.isPlaying = msg.data.isPlaying;
            }
            if (msg.data.isImmersive !== undefined) {
                GestureState.isImmersive = msg.data.isImmersive;
            }
            if (msg.data.isReversing !== undefined) {
                GestureState.isReversing = msg.data.isReversing;
            }
            if (msg.data.speed !== undefined) {
                GestureState.speed = msg.data.speed;
            }
            updateUI();
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

// --- UI Updates ---
function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('connectionStatus');
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
    const playStatusEl = document.getElementById('playStatus');

    if (GestureState.isPlaying && GestureState.isReversing) {
        playStatusEl.textContent = '倒播中';
        playStatusEl.classList.add('playing');
        playStatusEl.classList.remove('paused');
    } else if (GestureState.isPlaying) {
        playStatusEl.textContent = '播放中';
        playStatusEl.classList.add('playing');
        playStatusEl.classList.remove('paused');
    } else if (GestureState.isImmersive) {
        playStatusEl.textContent = '已暫停';
        playStatusEl.classList.remove('playing');
        playStatusEl.classList.add('paused');
    } else {
        playStatusEl.textContent = '已停止';
        playStatusEl.classList.remove('playing');
        playStatusEl.classList.remove('paused');
    }

    document.getElementById('speedStatus').textContent = GestureState.speed;
}

// --- Gesture Feedback ---
function showFeedback(icon, text) {
    const feedback = document.getElementById('gestureFeedback');
    feedback.innerHTML = `<div class="feedback-icon">${icon}</div><div class="feedback-text">${text}</div>`;
    feedback.classList.add('show');

    setTimeout(() => {
        feedback.classList.remove('show');
    }, 600);
}

// --- Gesture Handlers ---
function handleTap() {
    if (GestureState.isPlaying) {
        sendCommand('pause');
        showFeedback('⏸️', '暫停');
    } else {
        // 繼續播放時保持原有方向
        if (GestureState.isReversing) {
            sendCommand('rewind');
            showFeedback('⏪', '繼續倒播');
        } else {
            sendCommand('play');
            showFeedback('▶️', '繼續播放');
        }
    }
}

function handleSwipeUp() {
    const newSpeed = Math.min(100, GestureState.speed + 5);
    sendCommand('speed', newSpeed);
    showFeedback('🔼', `加速 → ${newSpeed}`);
}

function handleSwipeDown() {
    const newSpeed = Math.max(0, GestureState.speed - 5);
    sendCommand('speed', newSpeed);
    showFeedback('🔽', `減速 → ${newSpeed}`);
}

function handleSwipeLeft() {
    sendCommand('rewind');
    showFeedback('⏪', '倒播');
}

function handleSwipeRight() {
    sendCommand('play');
    showFeedback('⏩', '播放');
}

// --- Event Listeners ---
function initGestureEvents() {
    const gestureArea = document.getElementById('gestureArea');

    gestureArea.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchStartTime = Date.now();
    }, { passive: false });

    gestureArea.addEventListener('touchend', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        const duration = Date.now() - touchStartTime;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        // 判斷是點擊還是滑動
        if (absX < TAP_THRESHOLD && absY < TAP_THRESHOLD && duration < TAP_DURATION) {
            // 點擊
            handleTap();
        } else if (absX > absY && absX > SWIPE_THRESHOLD) {
            // 水平滑動
            if (deltaX > 0) {
                handleSwipeRight();
            } else {
                handleSwipeLeft();
            }
        } else if (absY > absX && absY > SWIPE_THRESHOLD) {
            // 垂直滑動
            if (deltaY > 0) {
                handleSwipeDown();
            } else {
                handleSwipeUp();
            }
        }
    }, { passive: false });

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
    initGestureEvents();
    connectWebSocket();
    updateUI();

    // 頁面載入時就啟用 NoSleep 防止手機休眠
    if (noSleep) {
        document.addEventListener('touchstart', function enableNoSleep() {
            noSleep.enable();
            document.removeEventListener('touchstart', enableNoSleep);
        }, { once: true });
    }
}

document.addEventListener('DOMContentLoaded', init);
