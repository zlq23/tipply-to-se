
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
    jwtDate: document.getElementById('jwtDate'),
    jwtInfo: document.getElementById('jwtInfo'),
    status: document.getElementById('status'),
    refreshHint: document.getElementById('refreshHint'),
    avatar: document.getElementById('avatar'),
    avatarContainer: document.getElementById('avatarContainer'),
    configBtn: document.getElementById('configBtn'),
    configOverlay: document.getElementById('configOverlay'),
    configForm: document.getElementById('configForm'),
    tipplyIdInput: document.getElementById('tipplyId'),
    seTokenInput: document.getElementById('seToken'),
    saveConfigBtn: document.getElementById('saveConfig')
};

let socket = null;

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


DOM.configOverlay.addEventListener('click', (e) => {
    if (e.target === DOM.configOverlay) {
        DOM.configOverlay.style.display = 'none';
    }
});

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

async function validateToken() {
    if (!CONFIG.SE_JWT_TOKEN) {
        updateStatus("Brak tokenu", false);
        return false;
    } else if (!CONFIG.TIPPLY_USER_ID) {
        updateStatus("Brak Tipply URL", false);
        return false;
    }

    const jwtData = parseJwt(CONFIG.SE_JWT_TOKEN);
    if (!jwtData || !jwtData.exp) {
        DOM.jwtDate.textContent = "Błędny token";
        updateStatus("Błąd tokenu", false);
        return false;
    }

    const expiryDate = new Date(jwtData.exp * 1000);
    const now = new Date();
    const diffDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    DOM.jwtDate.textContent = expiryDate.toLocaleString('pl-PL');

    if (diffDays <= 0) {
        DOM.jwtDate.className = 'expired';
        DOM.jwtInfo.innerText = '';
        DOM.refreshHint.innerHTML = 'Nowy token znajdziesz tu: <span class="refresh-link">www.streamelements.com/dashboard/account/channels</span>';
        updateStatus("Token wygasł", false);
        return false;
    }

    if (diffDays <= 7) DOM.jwtDate.className = 'warning';

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

        if (data.avatar) {
            DOM.avatar.src = data.avatar;
            DOM.avatarContainer.style.display = 'block';
        }

        return true;
    } catch (error) {
        DOM.jwtDate.className = 'expired';
        updateStatus("Nieprawidłowy token", false);
        return false;
    }
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
                message: formatMessageWithEmotes(tip.message) || '',
                amount: parseFloat((tip.amount / 100).toFixed(2)),
                currency: CONFIG.CURRENCY,
                imported: true,
            })
        });
    } catch (error) {
        updateStatus("Błąd wysyłania tipa", false);
    }
}

function formatMessageWithEmotes(message) {
    if (!message) return '';
    return message.replace(/<img[^>]*alt="([^"]*)"[^>]*>/g, function (match, altText) {
        return altText;
    });
}

function connectToTipply() {
    if (socket) socket.disconnect();

    socket = io(`wss://ws.tipply.pl/tip/${formatTipplyID(CONFIG.TIPPLY_USER_ID)}`, {
        path: "/socket.io",
        transports: ["websocket"]
    });

    socket.on("connect", () => {
        updateStatus("Połączono", true);
    });

    socket.on("disconnect", () => {
        updateStatus("Rozłączono", false);
    });

    socket.on("reconnecting", (attempt) => {
        updateStatus(`Próba połączenia (${attempt})`, false);
    });

    socket.on("reconnect_failed", () => {
        updateStatus("Błąd połączenia", false);
    });

    socket.on("tip", (data) => {
        const tip = JSON.parse(data);
        sendTipToSE(tip);
    });
}

async function init() {
    const isValid = await validateToken();
    if (isValid) {
        connectToTipply();
    }
}

init();
