function loadConfig() {
    return {
        TIPPLY_USER_ID: localStorage.getItem('tipply_user_id') || "",
        SE_JWT_TOKEN: localStorage.getItem('se_jwt_token') || "",
        CURRENCY: "PLN"
    };
}

function formatTipplyID(url) {
    if (!url) return null;
    const regex = /\/([^\/]+)$/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function saveConfig(tipplyId, seToken) {
    localStorage.setItem('tipply_user_id', tipplyId);
    localStorage.setItem('se_jwt_token', seToken);
}

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
    seLink: document.getElementById('seLink')
};

let socket = null;
let tokenWorker = null;

function setupEventListeners() {
    DOM.configBtn.addEventListener('click', () => {
        DOM.tipplyIdInput.value = CONFIG.TIPPLY_USER_ID;
        DOM.seTokenInput.value = CONFIG.SE_JWT_TOKEN;
        DOM.configOverlay.style.display = 'flex';
    });

    DOM.saveConfigBtn.addEventListener('click', () => {
        const tipplyId = DOM.tipplyIdInput.value.trim();
        const seToken = DOM.seTokenInput.value.trim();

        if (tipplyId === CONFIG.TIPPLY_USER_ID && seToken === CONFIG.SE_JWT_TOKEN) {
            DOM.configOverlay.style.display = 'none';
            return;
        }

        saveConfig(tipplyId, seToken);
        DOM.configOverlay.style.display = 'none';
        location.reload();
    });

    DOM.closeConfigBtn.addEventListener('click', () => {
        DOM.configOverlay.style.display = 'none';
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
            }, 2000);
        }).catch(() => {
            isCopying = false;
        });
    });
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

function updateTokenDisplay(totalMs) {
    const time = formatTime(totalMs);
    let displayText = totalMs < 86400000 ? 
        `${time.hours}h ${time.minutes}m ${time.seconds}s` : 
        `${time.days}d ${time.hours}h ${time.minutes}m`;
    
    DOM.jwtInfoGeneral.textContent = 'Token wygaśnie za:';
    DOM.jwtInfoExpiry.textContent = displayText;
    DOM.jwtInfoExpiry.className = time.days <= 7 ? 'warning' : 'ok';
}

function createWorker() {
    const workerCode = `
        self.onmessage = function(e) {
            const expiry = e.data.expiry;
            let isFinalDay = false;
            
            const check = () => {
                const now = Date.now();
                const diff = expiry - now;
                
                if (diff <= 0) {
                    postMessage({ expired: true });
                    clearInterval(interval);
                    return;
                }
                
                if (!isFinalDay && diff < 86400000) {
                    isFinalDay = true;
                    clearInterval(interval);
                    interval = setInterval(check, 1000);
                }
                
                postMessage({ 
                    totalMs: diff,
                    expired: false 
                });
            };
            
            let interval = setInterval(check, 60000);
            check();
        };
    `;
    
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    return new Worker(URL.createObjectURL(blob));
}

function startTokenWorker(expiryTimestamp) {
    if (tokenWorker) tokenWorker.terminate();
    
    tokenWorker = createWorker();
    tokenWorker.postMessage({ expiry: expiryTimestamp });
    
    tokenWorker.onmessage = (e) => {
        if (e.data.expired) {
            handleTokenExpired();
        } else {
            updateTokenDisplay(e.data.totalMs);
        }
    };
}

function handleTokenExpired() {
    DOM.jwtInfoGeneral.innerHTML = 'Zaktualizuj token <br> w <span style="font-weight: bold">ustawieniach</span>';
    DOM.jwtInfoExpiry.textContent = '';
    updateStatus("Token wygasł", false);
    disconnectSocket();
    if (tokenWorker) {
        tokenWorker.terminate();
        tokenWorker = null;
    }
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
    socket.on("tip", (data) => sendTipToSE(JSON.parse(data)));
}

async function sendTipToSE(tip) {
    try {
        await fetch(`https://api.streamelements.com/kappa/v2/tips/${CONFIG.SE_CHANNEL_ID}`, {
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
                message: tip.message?.replace(/<img[^>]*alt="([^"]*)"[^>]*>/g, (_, alt) => alt) || '',
                amount: parseFloat((tip.amount / 100).toFixed(2)),
                currency: CONFIG.CURRENCY,
                imported: true,
            })
        });
    } catch (error) {
        updateStatus("Błąd wysyłania tipa", false);
    }
}

async function validateToken() {
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

    startTokenWorker(jwtData.exp * 1000);

    try {
        const response = await fetch('https://api.streamelements.com/kappa/v2/channels/me', {
            headers: {
                'Authorization': `Bearer ${CONFIG.SE_JWT_TOKEN}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) throw new Error("Invalid token");

        const data = await response.json();
        CONFIG.SE_CHANNEL_ID = data._id;
        DOM.avatar.src = data.avatar || `data:image/png;base64,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`; 
        DOM.username.textContent = data.displayName || 'username';
        
        return true;
    } catch (error) {
        updateStatus("Niepoprawny SE token", false);
        return false;
    }
}

function init() {
    setupEventListeners();
    validateToken().then(isValid => isValid && connectToTipply());
}

init();
