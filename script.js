let unknownAvatar = 'assets/unknown-avatar.svg';
let socket = null;
let tokenWorker = null;
let errorTimeout = null;
let tokenExpiryTimestamp = null;
let tokenInterval = null;
const CONFIG = loadConfig();
const DOM = {
    jwtInfoContainer: document.getElementById('jwtInfoContainer'),
    jwtInfoGeneral: document.getElementById('infoGeneral'),
    jwtInfoExpiry: document.getElementById('infoExpiry'),        
    status: document.getElementById('statusContainer'),
    avatar: document.getElementById('avatar'),
    username: document.getElementById('username'),
    configBtn: document.getElementById('configBtn'),
    configOverlay: document.getElementById('configOverlay'),
    tipplyIdInput: document.getElementById('tipplyId'),
    seTokenInput: document.getElementById('seToken'),
    saveConfigBtn: document.getElementById('saveConfig'),
    closeConfigBtn: document.getElementById('closeConfig'),
    seLink: document.getElementById('seLink'),
    mainContainer: document.getElementById('mainContainer')
};

DOM.avatar.src = unknownAvatar;

if (typeof AbortSignal !== 'undefined' && !AbortSignal.timeout) {
  AbortSignal.timeout = function(ms) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    controller.signal.addEventListener('abort', () => clearTimeout(timer));
    return controller.signal;
  };
}

function setupEventListeners() {

    document.addEventListener("visibilitychange", () => {
        if (!document.hidden && tokenExpiryTimestamp) {
            startTokenCountdown(tokenExpiryTimestamp);
        }
    });

    DOM.configBtn.addEventListener('click', () => {
        DOM.tipplyIdInput.value = CONFIG.TIPPLY_USER_ID;
        DOM.seTokenInput.value = CONFIG.SE_JWT_TOKEN;
        showConfig();  
    });

    DOM.saveConfigBtn.addEventListener('click', () => {
        const tipplyId = DOM.tipplyIdInput.value.trim();
        const seToken = DOM.seTokenInput.value.trim();

        if (tipplyId === CONFIG.TIPPLY_USER_ID && seToken === CONFIG.SE_JWT_TOKEN) {
            hideConfig();
            return;
        }

        saveConfig({ tipplyId, seToken });
        hideConfig();
        location.reload();
    });

    DOM.closeConfigBtn.addEventListener('click', () => {
        hideConfig();
    });

    let isCopying = false;
    DOM.seLink.addEventListener('click', () => {
        if (isCopying) return;
        isCopying = true;
        const originalText = DOM.seLink.textContent;

        navigator.clipboard.writeText('https://streamelements.com/dashboard/account/channels').then(() => {
            DOM.seLink.textContent = "skopiowano do schowka";
            DOM.seLink.classList.add('copied');
            setTimeout(() => {
                DOM.seLink.textContent = originalText;
                DOM.seLink.classList.remove('copied');
                isCopying = false;
            }, 700);
        }).catch(() => {
            isCopying = false;
        });
    });

    window.addEventListener('beforeunload', () => {
        clearTimeout(errorTimeout);
    });    
}

function loadConfig() {
    return {
        TIPPLY_USER_ID: localStorage.getItem('tipply_user_id') || "",
        SE_JWT_TOKEN: localStorage.getItem('se_jwt_token') || "",
        SE_CHANNEL_ID: null,
        CURRENCY: "PLN"
    };
}

function formatTipplyID(input) {
    if (!input) return null;
    input = input.trim().replace(/\/+$/, ''); 
    const parts = input.split('/');
    const lastPart = parts[parts.length - 1];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(lastPart) ? lastPart : input;
}

function saveConfig({ tipplyId, seToken }) {
    localStorage.setItem('tipply_user_id', tipplyId);
    localStorage.setItem('se_jwt_token', seToken);
}

function showConfig() {
    DOM.configOverlay.style.display = 'flex';
    DOM.mainContainer.style.display = 'none';
}

function hideConfig() {
    DOM.configOverlay.style.display = 'none';
    DOM.mainContainer.style.display = 'flex';
}

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(base64));
    } catch (e) {
        return null;
    }
}

function updateStatus(text, isConnected) {
    DOM.status.textContent = text;
    DOM.status.className = isConnected ? 'connected' : 'disconnected';
}

function formatTime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    return { days, hours, minutes, seconds };
}

function sanitizeMessage(message) {
    const sanitizedMessage = message.replace(/<img[^>]*alt="([^"]*)"[^>]*>/g, (_, alt) => alt);
    return DOMPurify.sanitize(sanitizedMessage);
}

function updateTokenDisplay(totalMs) {
    const time = formatTime(totalMs);
    let displayText = totalMs < 86400000 ? 
        `${time.hours}h ${time.minutes}m ${time.seconds}s` : 
        `${time.days}d ${time.hours}h ${time.minutes}m`;
    
    DOM.jwtInfoGeneral.textContent = 'Token wygaśnie za:';
    DOM.jwtInfoExpiry.textContent = displayText;
    DOM.jwtInfoExpiry.className = time.days <= 7 ? 'warning' : 'ok';
}

function startTokenCountdown(expiryTimestamp) {
    tokenExpiryTimestamp = expiryTimestamp;
    if (tokenInterval) clearInterval(tokenInterval);

    const update = () => {
        const diff = expiryTimestamp - Date.now();
        if (diff <= 0) {
            handleTokenExpired();
            clearInterval(tokenInterval);
            tokenInterval = null;
        } else {
            updateTokenDisplay(diff);
        }
    };

    update();
    tokenInterval = setInterval(update, 1000);
}

function handleTokenExpired() {
    DOM.jwtInfoGeneral.innerHTML = 'Zaktualizuj token <br> w <span style="font-weight: bold">ustawieniach</span>';
    DOM.jwtInfoExpiry.textContent = '';
    updateStatus("Token wygasł", false);
    disconnectSocket();
}

function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

function connectToTipply() {
    disconnectSocket();

    socket = io(`wss://ws.tipply.pl/tip/${formatTipplyID(CONFIG.TIPPLY_USER_ID)}`, {
        path: "/socket.io",
        transports: ["websocket"]
    });

    socket.on("connect", () => updateStatus("Połączono", true));
    socket.on("disconnect", () => updateStatus("Rozłączono", false));
    socket.on("reconnecting", (attempt) => updateStatus(`Próba połączenia (${attempt})`, false));
    socket.on("reconnect_failed", () => updateStatus("Błąd połączenia", false));
    socket.on("tip", (data) => {
        try {
            const tip = JSON.parse(data);
            sendTipToSE(tip);
        } catch (e) {
            console.error("Nieprawidłowy JSON z Tipply:", e);
        }
    });

}

async function sendTipToSE(tip, maxRetries = 2) {
    for (let retry = 0; retry < maxRetries; retry++) {
        try {
            const response = await fetch(`https://api.streamelements.com/kappa/v2/tips/${CONFIG.SE_CHANNEL_ID}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CONFIG.SE_JWT_TOKEN}`,
                },
                body: JSON.stringify({
                    user: {
                        userId: tip.id || '',
                        username: tip.nickname || 'Anonymous',
                        email: tip.email || 'anonymous@tipply.pl',
                    },
                    provider: 'tipply',
                    message: sanitizeMessage(tip.message) || '',
                    amount: parseFloat((tip.amount / 100).toFixed(2)),
                    currency: CONFIG.CURRENCY,
                    imported: true,
                }),
                signal: AbortSignal.timeout(5000)
            });
        
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
            return true; 
        } catch (error) {

            if (error.message.includes("401")) {
                updateStatus("Niepoprawny token SE", false);
                return false;  
            }

            if (retry === maxRetries - 1) {
                updateStatus("Błąd wysyłania tipa", false);
                clearTimeout(errorTimeout); 
                errorTimeout = setTimeout(() => {
                    updateStatus(socket?.connected ? "Połączono" : "Rozłączono", !!socket?.connected);
                }, 3000);
            }

            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }        
}

async function validateToken(maxRetries = 3) {
    if (!CONFIG.SE_JWT_TOKEN || !CONFIG.TIPPLY_USER_ID) {
        DOM.jwtInfoGeneral.innerHTML = 'Uzupełnij pola w <br><span style="font-weight: bold">ustawieniach</span>';
        updateStatus("Brak konfiguracji", false);
        return false;
    }

    const jwtData = parseJwt(CONFIG.SE_JWT_TOKEN);
    if (!jwtData?.exp) {
        handleTokenExpired();
        return false;
    }

    tokenExpiryTimestamp = jwtData.exp * 1000;

    for (let retry = 0; retry < maxRetries; retry++) {
        try {
            const response = await fetch('https://api.streamelements.com/kappa/v2/channels/me', {
                headers: {
                    'Authorization': `Bearer ${CONFIG.SE_JWT_TOKEN}`,
                    'Accept': 'application/json'
                },
                signal: AbortSignal.timeout(5000)
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            CONFIG.SE_CHANNEL_ID = data._id;
            DOM.avatar.src = data.avatar || unknownAvatar;
            DOM.username.textContent = data.displayName || 'username';

            startTokenCountdown(tokenExpiryTimestamp);

            return true;
        } catch (error) {

            if (error.message.includes("401")) {
                updateStatus("Niepoprawny token SE", false);
                DOM.jwtInfoGeneral.innerHTML = 'Zaktualizuj token <br> w <span style="font-weight: bold">ustawieniach</span>';
                return false;  
            }
            
            if (retry === maxRetries - 1) {
                updateStatus( "Błąd połączenia z SE", false);
                DOM.jwtInfoGeneral.innerHTML = 'Zrestartuj aplikacje: <br> prawy myszki > odśwież';
                return false;
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

function init() {
    setupEventListeners();
    validateToken().then(isValid => isValid && connectToTipply());
}

init();
