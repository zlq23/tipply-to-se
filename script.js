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
        DOM.avatar.src = data.avatar || 'unknown.png'; 
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
