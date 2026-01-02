/**
 * Teleprompter Application Logic
 */

// --- 1. State Management ---
const State = {
    isPlaying: false,
    isReversing: false, // 倒播模式
    text: '',
    fontSize: 48,
    speed: 3,
    margin: 5,
    isFlipped: true,
    scrollPosition: 0,
    lastFrameTime: 0,
    guideHeight: 50,
    guideHeight: 50,
    fontFamily: "'Noto Sans TC', sans-serif",
    enableCountdown: true,
    isCountingDown: false,
    // Interaction State
    isImmersive: false, // Controls UI visibility (Full page vs Settings)
    isDragging: false,
    touchHasMoved: false,
    touchHasMoved: false,
    lastTouchY: 0,
    countdownTimer: null
};

// --- 2. DOM Elements ---
const Elements = {
    displayArea: document.getElementById('displayArea'),
    scrollContent: document.getElementById('scrollContent'),
    scriptInput: document.getElementById('scriptInput'),
    fontSizeSlider: document.getElementById('fontSizeSlider'),
    fontSizeDisplay: document.getElementById('fontSizeDisplay'),
    speedSlider: document.getElementById('speedSlider'),
    speedDisplay: document.getElementById('speedDisplay'),
    marginSlider: document.getElementById('marginSlider'),
    marginDisplay: document.getElementById('marginDisplay'),
    btnPlayPause: document.getElementById('btnPlayPause'),
    btnPlayPause: document.getElementById('btnPlayPause'),
    flipToggle: document.getElementById('flipToggle'),
    btnExit: document.getElementById('btnExit'),
    btnFullscreen: document.getElementById('btnFullscreen'),
    flipIndicator: document.getElementById('flipIndicator'),
    guideHeightSlider: document.getElementById('guideHeightSlider'),
    guideHeightDisplay: document.getElementById('guideHeightDisplay'),
    guideLine: document.getElementById('guideLine'),
    fontSelect: document.getElementById('fontSelect'),
    btnPaste: document.getElementById('btnPaste'),
    btnClear: document.getElementById('btnClear'),
    countdownToggle: document.getElementById('countdownToggle'),
    countdownOverlay: document.getElementById('countdownOverlay')
};

// --- 3. UI Controller ---

function updateUI() {
    // Sync Text
    if (!State.text) {
        Elements.scrollContent.innerHTML = '<div class="text-placeholder">請在下方輸入文字...</div>';
    } else {
        // Simple XSS prevention by replacing newlines with <br> and keeping text nodes
        Elements.scrollContent.innerText = State.text;
        Elements.scrollContent.innerHTML = Elements.scrollContent.innerHTML.replace(/\n/g, '<br>');
    }

    // Sync Font Size
    Elements.scrollContent.style.fontSize = `${State.fontSize}px`;
    Elements.fontSizeDisplay.textContent = `${State.fontSize}px`;

    // Sync Font Family
    Elements.scrollContent.style.fontFamily = State.fontFamily;

    // Sync Speed Display
    Elements.speedDisplay.textContent = State.speed;

    // Sync Margin
    if (Elements.marginDisplay) {
        Elements.marginDisplay.textContent = `${State.margin}%`;
        Elements.scrollContent.style.width = `${100 - (State.margin * 2)}%`;
    }

    // Sync Play/Pause Button (In Control Panel)
    const icon = Elements.btnPlayPause.querySelector('.icon');
    const text = Elements.btnPlayPause.lastChild;

    // Check Immersive State for container class
    const container = document.querySelector('.app-container');
    if (State.isImmersive) {
        container.classList.add('is-playing');
    } else {
        container.classList.remove('is-playing');
    }

    // Button is always Play since we always reset
    // No need to toggle text/icon if we don't support Pause state in UI
    /*
    if (State.isPlaying) {
        icon.textContent = '⏸';
        text.textContent = ' 暫停';
        Elements.btnPlayPause.classList.remove('primary');
        Elements.btnPlayPause.classList.add('secondary');
    } else {
        icon.textContent = '▶';
        text.textContent = ' 播放';
        Elements.btnPlayPause.classList.add('primary');
        Elements.btnPlayPause.classList.remove('secondary');
    }
    */

    // Sync Flip State
    if (State.isFlipped) {
        Elements.displayArea.classList.add('flipped');
        if (Elements.flipToggle) Elements.flipToggle.checked = true;
    } else {
        Elements.displayArea.classList.remove('flipped');
        if (Elements.flipToggle) Elements.flipToggle.checked = false;
    }

    // Sync Guide Height
    if (Elements.guideLine) {
        Elements.guideLine.style.top = `${State.guideHeight}%`;
    }
    if (Elements.guideHeightDisplay) {
        Elements.guideHeightDisplay.textContent = `${State.guideHeight}%`;
    }
}

// --- 4. Event Listeners ---

function initEvents() {
    // Text Input
    Elements.scriptInput.addEventListener('input', (e) => {
        State.text = e.target.value;
        updateUI();
        // 同步文字到遙控器
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'text', data: State.text }));
        }
    });

    // Paste Button
    if (Elements.btnPaste) {
        Elements.btnPaste.addEventListener('click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                if (text) {
                    // Option 1: Append
                    // Elements.scriptInput.value += text;
                    // Option 2: Replace (User might prefer just setting it) -> Let's append if not empty?
                    // Let's just set proper value. If specific cursor position needed, that's complex.
                    // Simple approach: Input value += text or just focus.
                    // Let's Insert at cursor position if possible, or append.

                    const el = Elements.scriptInput;
                    const start = el.selectionStart;
                    const end = el.selectionEnd;
                    const val = el.value;

                    const before = val.substring(0, start);
                    const after = val.substring(end);

                    el.value = before + text + after;
                    el.selectionStart = el.selectionEnd = start + text.length;
                    el.focus();

                    // Trigger input event manually to update state
                    el.dispatchEvent(new Event('input'));
                }
            } catch (err) {
                console.error('Failed to read clipboard contents: ', err);
                alert('無法讀取剪貼簿內容，請確認瀏覽器權限。');
            }
        });
    }

    // Clear Button
    if (Elements.btnClear) {
        Elements.btnClear.addEventListener('click', () => {
            if (confirm('確定要清除所有內容嗎？')) {
                State.text = '';
                Elements.scriptInput.value = '';
                updateUI();
            }
        });
    }

    // Font Size
    Elements.fontSizeSlider.addEventListener('input', (e) => {
        State.fontSize = parseInt(e.target.value, 10);
        updateUI();
    });

    // Speed
    Elements.speedSlider.addEventListener('input', (e) => {
        State.speed = parseInt(e.target.value, 10);
        updateUI();
    });

    // Margin
    if (Elements.marginSlider) {
        Elements.marginSlider.addEventListener('input', (e) => {
            State.margin = parseInt(e.target.value, 10);
            updateUI();
        });
    }

    // Guide Height
    if (Elements.guideHeightSlider) {
        Elements.guideHeightSlider.addEventListener('input', (e) => {
            State.guideHeight = parseInt(e.target.value, 10);
            updateUI();
        });
    }

    // Font Family
    if (Elements.fontSelect) {
        Elements.fontSelect.addEventListener('change', (e) => {
            State.fontFamily = e.target.value;
            updateUI();
        });
    }

    // Countdown Toggle
    if (Elements.countdownToggle) {
        Elements.countdownToggle.addEventListener('change', (e) => {
            State.enableCountdown = e.target.checked;
        });
    }

    // Play Button (Enters Immersive + Starts)
    Elements.btnPlayPause.addEventListener('click', startImmersivePlayback);



    // Flip Toggle
    if (Elements.flipToggle) {
        Elements.flipToggle.addEventListener('change', (e) => {
            State.isFlipped = e.target.checked;
            updateUI();
        });
    }

    // Exit Button
    if (Elements.btnExit) {
        Elements.btnExit.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering tap-to-pause on container
            exitImmersive();
        });
    }

    // Fullscreen Button
    if (Elements.btnFullscreen) {
        Elements.btnFullscreen.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFullscreen();
        });
    }

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        // Ignore if typing in textarea
        if (document.activeElement === Elements.scriptInput) return;

        switch (e.code) {
            case 'Space':
                e.preventDefault(); // Prevent page scroll
                if (State.isImmersive) {
                    togglePause();
                } else {
                    startImmersivePlayback();
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                adjustScroll(-50);
                break;
            case 'ArrowDown':
                e.preventDefault();
                adjustScroll(50);
                break;
            case 'Escape':
                if (State.isImmersive) exitImmersive();
                break;
        }
    });

    // Mouse Wheel (Optional manual scroll when paused)
    Elements.displayArea.addEventListener('wheel', (e) => {
        if (!State.isPlaying) {
            e.preventDefault();
            adjustScroll(e.deltaY);
        }
    });

    // Touch Events for Manual Control during Playback
    // Touch Events for Manual Control + Tap to Pause
    Elements.displayArea.addEventListener('touchstart', (e) => {
        if (State.isImmersive) {
            State.isDragging = true;
            State.touchHasMoved = false;
            State.lastTouchY = e.touches[0].clientY;
        }
    }, { passive: false });

    Elements.displayArea.addEventListener('touchmove', (e) => {
        if (State.isImmersive && State.isDragging) {
            State.touchHasMoved = true;
            e.preventDefault(); // Prevent standard page scroll
            const currentY = e.touches[0].clientY;
            const deltaY = State.lastTouchY - currentY;
            State.lastTouchY = currentY;
            adjustScroll(deltaY);
        }
    }, { passive: false });

    Elements.displayArea.addEventListener('touchend', (e) => {
        State.isDragging = false;

        // If not a drag (touchend without move), treat as Tap
        if (!State.touchHasMoved && State.isImmersive) {
            // Prevent phantom clicks if needed, though usually fine
            togglePause();
        }
    });

    Elements.displayArea.addEventListener('touchcancel', () => {
        State.isDragging = false;
    });
}

// --- 5. Core Logic ---

function startImmersivePlayback() {
    State.isImmersive = true;

    // Auto-enter fullscreen
    if (!document.fullscreenElement) {
        toggleFullscreen();
    }

    // Always reset scroll position to top when starting
    State.scrollPosition = 0;
    const scrollTarget = document.getElementById('scrollWrapper');
    if (scrollTarget) scrollTarget.scrollTop = 0;
    // Also reset displayArea just in case
    Elements.displayArea.scrollTop = 0;

    updateUI();

    if (State.enableCountdown) {
        runCountdown(() => {
            State.isPlaying = true;
            State.lastFrameTime = performance.now();
            requestAnimationFrame(renderLoop);
            updateUI();
            sendState(); // 同步播放狀態到遙控器
        });
    } else {
        State.isPlaying = true;
        State.lastFrameTime = performance.now();
        requestAnimationFrame(renderLoop);
        updateUI();
        sendState(); // 同步播放狀態到遙控器
    }
}

function runCountdown(callback) {
    // Clear any existing timer to prevent duplicates
    if (State.countdownTimer) {
        clearInterval(State.countdownTimer);
        State.countdownTimer = null;
    }

    State.isCountingDown = true;
    Elements.countdownOverlay.style.display = 'block';

    // Reset to initial count
    let count = 3;
    Elements.countdownOverlay.textContent = count;

    State.countdownTimer = setInterval(() => {
        count--;
        if (count > 0) {
            Elements.countdownOverlay.textContent = count;
        } else {
            clearInterval(State.countdownTimer);
            State.countdownTimer = null;
            Elements.countdownOverlay.style.display = 'none';
            State.isCountingDown = false;

            // Only proceed if we are still in immersive mode (user didn't exit during countdown)
            if (State.isImmersive) {
                callback();
            }
        }
    }, 1000);
}

function exitImmersive() {
    // Clear countdown if running
    if (State.countdownTimer) {
        clearInterval(State.countdownTimer);
        State.countdownTimer = null;
    }
    Elements.countdownOverlay.style.display = 'none';
    State.isCountingDown = false;

    State.isImmersive = false;
    State.isPlaying = false;
    resetScroll(); // Logic to reset position if desired, or just stop
}

function togglePause() {
    if (!State.isImmersive) return;

    // 暫停/繼續播放，不退出全屏模式
    if (State.isPlaying) {
        // 暫停播放
        State.isPlaying = false;
        sendState();
    } else {
        // 繼續播放
        State.isPlaying = true;
        State.lastFrameTime = performance.now();
        requestAnimationFrame(renderLoop);
        sendState();
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

function resetScroll() {
    State.isPlaying = false;
    // Note: We don't necessarily exit immersive mode here if we just want to reset to top while playing?
    // But typically reset is "Stop and Reset".
    // If called from Exit button, isImmersive is handled by exitImmersive.
    // If called from Reset button (panel), likely not immersive.

    State.scrollPosition = 0;

    // Auto-exit fullscreen when stopping
    if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen();
    }

    const scrollTarget = document.getElementById('scrollWrapper');
    if (scrollTarget) {
        scrollTarget.scrollTop = 0;
    }
    // Also reset displayArea just in case, though we rely on wrapper now
    Elements.displayArea.scrollTop = 0;

    updateUI();
}



function adjustScroll(delta) {
    State.scrollPosition += delta;

    const scrollTarget = document.getElementById('scrollWrapper');
    if (!scrollTarget) return;

    // Boundary checks
    const maxScroll = scrollTarget.scrollHeight - scrollTarget.clientHeight;

    if (State.scrollPosition < 0) State.scrollPosition = 0;
    if (State.scrollPosition > maxScroll) State.scrollPosition = maxScroll;

    scrollTarget.scrollTop = State.scrollPosition;
}

function renderLoop(timestamp) {
    if (!State.isPlaying) return;

    // Skip auto-scroll if user is manually dragging
    if (State.isDragging) {
        requestAnimationFrame(renderLoop);
        return;
    }

    const rawSpeed = State.speed;
    let pixelsPerFrame = 0;

    if (rawSpeed > 0) {
        // Formula: 0.2 + (speed / 100)^1.5 * 5
        pixelsPerFrame = 0.2 + Math.pow(rawSpeed / 100, 1.5) * 5;
    }

    if (rawSpeed === 0) pixelsPerFrame = 0;

    // Update Position - 根據 isReversing 決定方向
    if (State.isReversing) {
        State.scrollPosition -= pixelsPerFrame; // 倒播
    } else {
        State.scrollPosition += pixelsPerFrame; // 正常播放
    }

    // Apply to DOM
    const scrollTarget = document.getElementById('scrollWrapper');
    if (!scrollTarget) {
        State.isPlaying = false;
        updateUI();
        return;
    }

    scrollTarget.scrollTop = State.scrollPosition;

    // Auto-stop at boundaries
    const maxScroll = scrollTarget.scrollHeight - scrollTarget.clientHeight;

    // 到達底部時停止（正向播放）
    if (!State.isReversing && State.scrollPosition >= maxScroll + 50) {
        State.isPlaying = false;
        updateUI();
        sendState();
        return;
    }

    // 到達頂部時停止（倒播）
    if (State.isReversing && State.scrollPosition <= 0) {
        State.scrollPosition = 0;
        State.isPlaying = false;
        State.isReversing = false;
        updateUI();
        sendState();
        return;
    }

    requestAnimationFrame(renderLoop);
}

// --- 6. WebSocket Client ---
let ws = null;
let wsReconnectAttempts = 0;
const WS_MAX_RECONNECT = 5;
const WS_RECONNECT_DELAY = 3000;

function initWebSocket() {
    // Only connect if running through the Node.js server (not file://)
    if (window.location.protocol === 'file:') {
        console.log('Running locally without server, WebSocket disabled');
        const container = document.getElementById('qrcodeContainer');
        if (container) {
            container.innerHTML = '<div class="qrcode-loading">請使用 npm start 啟動伺服器</div>';
        }
        return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}?type=teleprompter`;

    console.log('Connecting to WebSocket:', wsUrl);

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('WebSocket connected');
        wsReconnectAttempts = 0;
        updateWSStatus(true);

        // Send initial state
        sendState();
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected');
        updateWSStatus(false);

        // Attempt reconnection
        if (wsReconnectAttempts < WS_MAX_RECONNECT) {
            wsReconnectAttempts++;
            console.log(`Reconnecting... (${wsReconnectAttempts}/${WS_MAX_RECONNECT})`);
            setTimeout(initWebSocket, WS_RECONNECT_DELAY);
        }
    };

    ws.onerror = (err) => {
        console.error('WebSocket error:', err);
    };

    ws.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data);
            handleRemoteCommand(msg);
        } catch (err) {
            console.error('Invalid WebSocket message:', err);
        }
    };
}

function handleRemoteCommand(msg) {
    console.log('Received command:', msg);

    switch (msg.type) {
        case 'command':
            switch (msg.command) {
                case 'play':
                    if (!State.isImmersive) {
                        startImmersivePlayback();
                    } else if (!State.isPlaying) {
                        // Resume if paused - 繼續播放而非退出
                        State.isReversing = false; // 重設為正向播放
                        State.isPlaying = true;
                        State.lastFrameTime = performance.now();
                        requestAnimationFrame(renderLoop);
                        sendState();
                    } else if (State.isReversing) {
                        // 如果正在倒播，切換為正向播放
                        State.isReversing = false;
                        sendState();
                    }
                    break;

                case 'pause':
                    // 只暫停，不退出全屏模式
                    if (State.isImmersive && State.isPlaying) {
                        State.isPlaying = false;
                        sendState();
                    }
                    break;

                case 'rewind':
                    // 倒播 - 切換為反向播放模式
                    if (State.isImmersive) {
                        State.isReversing = true;
                        if (!State.isPlaying) {
                            State.isPlaying = true;
                            State.lastFrameTime = performance.now();
                            requestAnimationFrame(renderLoop);
                        }
                        sendState();
                    }
                    break;

                case 'stop':
                    if (State.isImmersive) {
                        exitImmersive();
                    }
                    break;

                case 'speed':
                    if (msg.value !== undefined) {
                        State.speed = Math.max(0, Math.min(100, parseInt(msg.value, 10)));
                        Elements.speedSlider.value = State.speed;
                        updateUI();
                        sendState();
                    }
                    break;

                case 'scroll':
                    if (msg.value !== undefined) {
                        adjustScroll(parseInt(msg.value, 10));
                    }
                    break;
            }
            break;

        case 'text':
            // Update text from remote
            State.text = msg.data;
            Elements.scriptInput.value = msg.data;
            updateUI();
            break;
    }
}

function sendState() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'state',
            data: {
                isPlaying: State.isPlaying,
                isImmersive: State.isImmersive,
                isReversing: State.isReversing,
                speed: State.speed,
                text: State.text
            }
        }));
    }
}

function updateWSStatus(connected) {
    const statusEl = document.getElementById('wsStatus');
    if (statusEl) {
        if (connected) {
            statusEl.innerHTML = '<span class="status-dot"></span> 已連線';
            statusEl.classList.add('connected');
        } else {
            statusEl.innerHTML = '<span class="status-dot"></span> 未連線';
            statusEl.classList.remove('connected');
        }
    }
}

function loadQRCode() {
    if (window.location.protocol === 'file:') return;

    fetch('/api/qrcode')
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById('qrcodeContainer');
            const urlEl = document.getElementById('remoteUrl');

            if (container && data.qrcode) {
                container.innerHTML = `<img src="${data.qrcode}" alt="QR Code" class="qrcode-img">`;
            }

            if (urlEl && data.url) {
                urlEl.innerHTML = `<a href="${data.url}" target="_blank">${data.url}</a>`;
            }
        })
        .catch(err => {
            console.error('Failed to load QR code:', err);
            const container = document.getElementById('qrcodeContainer');
            if (container) {
                container.innerHTML = '<div class="qrcode-loading">無法載入 QR Code</div>';
            }
        });
}

// Hook into state changes to broadcast
const originalStartImmersive = startImmersivePlayback;
startImmersivePlayback = function () {
    originalStartImmersive();
    sendState();
};

const originalExitImmersive = exitImmersive;
exitImmersive = function () {
    originalExitImmersive();
    sendState();
};

// --- 7. Initialization ---
function init() {
    updateUI();
    initEvents();
    initWebSocket();
    loadQRCode();
}

init();
