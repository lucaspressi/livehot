// API Configuration
const API_BASE_URL = window.API_BASE_URL || '/api';

// Global state
let currentUser = null;
let currentStream = null;
let loginTimeout;

let cameraEnabled = false;
let micEnabled = false;
let livekitRoom = null;
let previewStream = null;
let viewerRoom = null;
let currentPlayingStreamId = null;

// Feed pagination state
let feedPage = 1;
let feedLoading = false;
const feedLimit = 5;

// Theme system
const defaultTheme = { mode: 'dark', accentColor: '#ec4899', special: '' };

function applyTheme(theme = defaultTheme) {
    document.body.classList.remove('light-theme', 'halloween-theme', 'christmas-theme');
    if (theme.mode === 'light') {
        document.body.classList.add('light-theme');
    }
    if (theme.special === 'halloween') {
        document.body.classList.add('halloween-theme');
    } else if (theme.special === 'christmas') {
        document.body.classList.add('christmas-theme');
    }
    document.documentElement.style.setProperty('--accent-color', theme.accentColor || defaultTheme.accentColor);
}

function loadStoredTheme() {
    const stored = localStorage.getItem('theme');
    if (stored) {
        try { 
            return JSON.parse(stored); 
        } catch (e) {
            console.warn('Failed to parse stored theme:', e);
        }
    }
    return defaultTheme;
}

function storeTheme(theme) {
    localStorage.setItem('theme', JSON.stringify(theme));
}

// Accessibility: High contrast mode
function applyContrast() {
    const appBody = document.getElementById('app-body') || document.body;
    if (localStorage.getItem('highContrast') === 'true') {
        appBody.classList.add('high-contrast');
    } else {
        appBody.classList.remove('high-contrast');
    }
}

function toggleContrast() {
    const enabled = localStorage.getItem('highContrast') === 'true';
    localStorage.setItem('highContrast', String(!enabled));
    applyContrast();
    
    // Announce change to screen readers
    const announcement = enabled ? 'Alto contraste desativado' : 'Alto contraste ativado';
    announceToScreenReader(announcement);
}

// Accessibility: Closed captions toggle
function toggleCaptions() {
    const video = document.getElementById('broadcast-video');
    const track = video ? video.textTracks[0] : null;
    const btn = document.getElementById('caption-btn');
    if (!track || !btn) return;
    
    if (track.mode === 'showing') {
        track.mode = 'hidden';
        btn.textContent = 'CC Off';
        btn.setAttribute('aria-pressed', 'false');
        announceToScreenReader('Legendas desativadas');
    } else {
        track.mode = 'showing';
        btn.textContent = 'CC On';
        btn.setAttribute('aria-pressed', 'true');
        announceToScreenReader('Legendas ativadas');
    }
}

// Accessibility: Screen reader announcements
function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
        if (announcement.parentNode) {
            announcement.remove();
        }
    }, 1000);
}

// API Service
const api = {
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        };

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers,
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error?.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Auth
    async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    },

    async register(email, password, username, displayName) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, username, displayName }),
        });
    },

    async getCurrentUser() {
        return this.request('/auth/me');
    },

    // Streams
    async getStreams(page = 1, limit = 20, category = null) {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        if (category) params.append('category', category);
        return this.request(`/streams?${params.toString()}`);
    },

    async createStream(streamData) {
        return this.request('/streams', {
            method: 'POST',
            body: JSON.stringify(streamData),
        });
    },

    async startStream(streamId) {
        return this.request(`/streams/${streamId}/start`, {
            method: 'POST',
        });
    },

    async stopStream(streamId) {
        return this.request(`/streams/${streamId}/stop`, {
            method: 'POST',
        });
    },

    async startBroadcast(streamId) {
        return this.request(`/broadcast/${streamId}`, {
            method: 'POST',
        });
    },

    // Wallet
    async getWallet() {
        return this.request('/wallet');
    },

    async purchaseCoins(packageType) {
        return this.request('/wallet/purchase', {
            method: 'POST',
            body: JSON.stringify({ package: packageType }),
        });
    },

    // Users
    async updateUser(userId, data) {
        return this.request(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async updatePreferences(categories) {
        return this.request('/users/preferences', {
            method: 'PUT',
            body: JSON.stringify({ categories }),
        });
    },

    // Gifts
    async getGifts() {
        return this.request('/gifts');
    },

    async sendGift(giftId, recipientId) {
        return this.request('/gifts/send', {
            method: 'POST',
            body: JSON.stringify({ giftId, recipientId }),
        });
    }
};

// Utility functions
function showElement(id) {
    const element = document.getElementById(id);
    if (element) {
        element.classList.remove('hidden');
        element.removeAttribute('aria-hidden');
    }
}

function hideElement(id) {
    const element = document.getElementById(id);
    if (element) {
        element.classList.add('hidden');
        element.setAttribute('aria-hidden', 'true');
    }
}

function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
        page.setAttribute('aria-hidden', 'true');
    });

    // Hide live broadcast UI when leaving broadcast page
    if (pageId !== 'broadcast') {
        hideElement('broadcast-session');
        stopPreviewStream();
    }
    
    // Show selected page
    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
        targetPage.classList.remove('hidden');
        targetPage.removeAttribute('aria-hidden');
        
        // Focus management for accessibility
        const firstFocusable = targetPage.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
            firstFocusable.focus();
        }
    }
    
    // Update navigation if it exists
    const navButtons = document.querySelectorAll('.nav-btn');
    if (navButtons.length > 0) {
        navButtons.forEach(btn => {
            btn.classList.remove('text-white');
            btn.classList.add('text-slate-400');
            btn.setAttribute('aria-selected', 'false');
        });
        
        // Highlight current nav button
        const currentNavBtn = document.querySelector(`[onclick="showPage('${pageId}')"]`);
        if (currentNavBtn) {
            currentNavBtn.classList.remove('text-slate-400');
            currentNavBtn.classList.add('text-white');
            currentNavBtn.setAttribute('aria-selected', 'true');
        }
    }
    
    // Announce page change
    const pageNames = {
        'home': 'Página inicial',
        'wallet': 'Carteira',
        'profile': 'Perfil',
        'broadcast': 'Transmissão',
        'login': 'Login'
    };
    announceToScreenReader(`Navegado para ${pageNames[pageId] || pageId}`);
    
    // Load page content
    switch(pageId) {
        case 'home':
            loadMoreStreams();
            break;
        case 'wallet':
            loadWallet();
            break;
        case 'profile':
            loadProfile();
            break;
        case 'broadcast':
            if (!currentUser?.isStreamer) {
                showPage('home');
                showNotification('Apenas streamers podem acessar esta página', 'error');
                return;
            }
            if (livekitRoom) {
                showElement('broadcast-session');
            } else {
                ensurePreviewStream();
            }
            break;
        case 'login':
            hideElement('navigation');
            break;
        default:
            if (currentUser) {
                showElement('navigation');
            }
            break;
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg text-white max-w-sm transition-all duration-300 ${
        type === 'error' ? 'bg-red-600' : 
        type === 'success' ? 'bg-green-600' : 
        'bg-blue-600'
    }`;
    notification.textContent = message;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// Auth functions
async function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await api.getCurrentUser();
            currentUser = response.data;
            
            // Apply user's theme settings
            const theme = { 
                mode: currentUser.theme || 'dark', 
                accentColor: currentUser.accentColor || defaultTheme.accentColor, 
                special: currentUser.specialTheme || '' 
            };
            applyTheme(theme);
            storeTheme(theme);
            
            updateAuthUI();
            return true;
        } catch (error) {
            console.warn('Auth check failed:', error);
            localStorage.removeItem('token');
            currentUser = null;
        }
    }
    return false;
}

function updateAuthUI() {
    if (currentUser) {
        showElement('navigation');
        hideElement('login-page');
        
        // Update user info in UI
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(el => {
            el.textContent = currentUser.displayName || currentUser.username;
        });
        
        const userAvatarElements = document.querySelectorAll('.user-avatar');
        userAvatarElements.forEach(el => {
            el.src = currentUser.avatarUrl || '';
            el.alt = `Avatar de ${currentUser.displayName || currentUser.username}`;
        });
        
        const walletElements = document.querySelectorAll('.wallet-balance');
        walletElements.forEach(el => {
            el.textContent = `${currentUser.walletBalance || 0} coins`;
        });
    } else {
        hideElement('navigation');
        showPage('login');
    }
}

function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    if (livekitRoom) {
        livekitRoom.disconnect();
        livekitRoom = null;
    }
    showPage('login');
    showNotification('Logout realizado com sucesso!', 'success');
}

// Login timer functions
function startLoginTimer(minutes = 2) {
    const modal = document.getElementById('login-modal');
    if (!modal || currentUser) return;
    
    clearTimeout(loginTimeout);
    loginTimeout = setTimeout(() => {
        if (!currentUser) {
            showElement('login-modal');
        }
    }, minutes * 60 * 1000);
}

function cancelLoginTimer() {
    clearTimeout(loginTimeout);
    hideElement('login-modal');
}

// Profile functions
function loadProfile() {
    if (!currentUser) {
        showNotification('Faça login para editar o perfil', 'error');
        showPage('login');
        return;
    }
    
    const avatarUrlInput = document.getElementById('avatar-url');
    const displayNameInput = document.getElementById('display-name');
    const profileAvatar = document.getElementById('profile-avatar');
    const themeToggle = document.getElementById('profile-theme-toggle');
    const accentColorInput = document.getElementById('accent-color');
    const seasonThemeSelect = document.getElementById('season-theme');
    
    if (avatarUrlInput) avatarUrlInput.value = currentUser.avatarUrl || '';
    if (displayNameInput) displayNameInput.value = currentUser.displayName || '';
    if (profileAvatar) {
        profileAvatar.src = currentUser.avatarUrl || '';
        profileAvatar.alt = `Avatar de ${currentUser.displayName || currentUser.username}`;
    }
    if (themeToggle) themeToggle.checked = currentUser.theme === 'light';
    if (accentColorInput) accentColorInput.value = currentUser.accentColor || defaultTheme.accentColor;
    if (seasonThemeSelect) seasonThemeSelect.value = currentUser.specialTheme || '';
}

async function saveProfile() {
    if (!currentUser) return;
    
    const avatarUrl = document.getElementById('avatar-url')?.value || '';
    const displayName = document.getElementById('display-name')?.value || '';
    const theme = document.getElementById('profile-theme-toggle')?.checked ? 'light' : 'dark';
    const accentColor = document.getElementById('accent-color')?.value || defaultTheme.accentColor;
    const specialTheme = document.getElementById('season-theme')?.value || '';
    
    const data = {
        avatarUrl,
        displayName,
        theme,
        accentColor,
        specialTheme,
    };

    try {
        const response = await api.updateUser(currentUser.id, data);
        currentUser = response.data;
        
        // Apply new theme
        const newTheme = { mode: theme, accentColor, special: specialTheme };
        applyTheme(newTheme);
        storeTheme(newTheme);
        
        updateAuthUI();
        loadProfile();
        showNotification('Perfil atualizado com sucesso!', 'success');
    } catch (error) {
        showNotification('Erro ao atualizar perfil: ' + error.message, 'error');
    }
}

// Broadcast functions
function toggleCamera() {
    cameraEnabled = !cameraEnabled;
    const btn = document.getElementById('camera-btn');
    if (btn) {
        btn.textContent = cameraEnabled ? '📹 Câmera Ligada' : '📹 Câmera Desligada';
        btn.classList.toggle('bg-green-600', cameraEnabled);
        btn.classList.toggle('bg-gray-600', !cameraEnabled);
        btn.setAttribute('aria-pressed', cameraEnabled.toString());
        btn.setAttribute('aria-label', cameraEnabled ? 'Desativar câmera' : 'Ativar câmera');
    }
    
    if (livekitRoom && livekitRoom.localParticipant) {
        const videoTrack = livekitRoom.localParticipant.videoTracks.values().next().value;
        if (videoTrack) {
            videoTrack.mute(!cameraEnabled);
        }
    } else {
        ensurePreviewStream();
    }
    
    announceToScreenReader(cameraEnabled ? 'Câmera ativada' : 'Câmera desativada');
}

function toggleMic() {
    micEnabled = !micEnabled;
    const btn = document.getElementById('mic-btn');
    if (btn) {
        btn.textContent = micEnabled ? '🎤 Microfone Ligado' : '🎤 Microfone Desligado';
        btn.classList.toggle('bg-green-600', micEnabled);
        btn.classList.toggle('bg-gray-600', !micEnabled);
        btn.setAttribute('aria-pressed', micEnabled.toString());
        btn.setAttribute('aria-label', micEnabled ? 'Desativar microfone' : 'Ativar microfone');
    }
    
    if (livekitRoom && livekitRoom.localParticipant) {
        const audioTrack = livekitRoom.localParticipant.audioTracks.values().next().value;
        if (audioTrack) {
            audioTrack.mute(!micEnabled);
        }
    } else {
        ensurePreviewStream();
    }
    
    announceToScreenReader(micEnabled ? 'Microfone ativado' : 'Microfone desativado');
}

async function ensurePreviewStream() {
    if (!previewStream) {
        try {
            previewStream = await navigator.mediaDevices.getUserMedia({
                video: cameraEnabled,
                audio: micEnabled,
            });
            const videoElement = document.getElementById('broadcast-video');
            if (videoElement) {
                videoElement.srcObject = previewStream;
                videoElement.muted = true;
                try { await videoElement.play(); } catch {}
            }
        } catch (err) {
            console.error('getUserMedia error', err);
            showNotification('Permita acesso à câmera e microfone', 'error');
            cameraEnabled = false;
            micEnabled = false;
        }
    } else {
        previewStream.getVideoTracks().forEach(t => t.enabled = cameraEnabled);
        previewStream.getAudioTracks().forEach(t => t.enabled = micEnabled);
    }
}

function stopPreviewStream() {
    if (previewStream) {
        previewStream.getTracks().forEach(t => t.stop());
        previewStream = null;
    }
}

async function startStreamBroadcast() {
    if (!currentUser?.isStreamer || !currentStream) {
        showNotification('Erro: usuário não autorizado ou stream não encontrada', 'error');
        return;
    }

    try {
        await ensurePreviewStream();
        const response = await api.startBroadcast(currentStream.id);
        const { url, token, room } = response.data;

        // Initialize LiveKit
        if (!window.livekitClient) {
            try {
                window.livekitClient = await import('https://unpkg.com/livekit-client/dist/livekit-client.esm.js');
            } catch (error) {
                showNotification('Erro ao carregar LiveKit. Verifique sua conexão.', 'error');
                return;
            }
        }

        const { Room } = window.livekitClient;
        livekitRoom = new Room();
        
        await livekitRoom.connect(url, token);
        
        // Get local tracks
        const tracks = await window.livekitClient.createLocalTracks({
            audio: micEnabled,
            video: cameraEnabled,
        });
        
        // Publish tracks
        for (const track of tracks) {
            await livekitRoom.localParticipant.publishTrack(track);
            if (track.kind === 'video') {
                const videoElement = document.getElementById('broadcast-video');
                if (videoElement) {
                    track.attach(videoElement);
                }
            }
        }
        
        showElement('broadcast-session');
        showNotification('Transmissão iniciada com sucesso!', 'success');
        
    } catch (error) {
        console.error('Broadcast error:', error);
        showNotification('Erro ao iniciar transmissão: ' + error.message, 'error');
    }
}

// Stream feed functions
async function loadMoreStreams() {
    if (feedLoading) return;
    
    const container = document.getElementById('feed');
    if (!container) return;

    feedLoading = true;
    try {
        const response = await api.getStreams(feedPage, feedLimit);
        const streams = response.data.streams || [];

        if (streams.length === 0 && feedPage === 1) {
            container.innerHTML = '<div class="text-center text-slate-400 py-12">Nenhuma stream ao vivo</div>';
            feedLoading = false;
            return;
        }

        streams.forEach(stream => {
            const slide = document.createElement('div');
            slide.className = 'slide';
            slide.innerHTML = `
                <img src="${stream.thumbnailUrl}" alt="${stream.title}" loading="lazy">
                <div class="actions">
                    <button onclick="likeStream('${stream.id}')" aria-label="Curtir stream ${stream.title}">❤️</button>
                    <button onclick="shareStream('${stream.id}')" aria-label="Compartilhar stream ${stream.title}">🔗</button>
                </div>`;
            container.appendChild(slide);
        });

        feedPage += 1;
        announceToScreenReader(`${streams.length} streams carregadas`);
    } catch (error) {
        console.error('Error loading streams:', error);
    }
    feedLoading = false;
}

// Legacy compatibility function
async function loadStreams() {
    const feed = document.getElementById('feed');
    if (feed && feed.childElementCount <= 1) {
        await loadMoreStreams();
    }
}

function openStream(streamId) {
    viewStream(streamId);
}

async function viewStream(streamId) {
    if (!streamId) return;
    try {
        const response = await api.startBroadcast(streamId);
        const { url, token } = response.data;

        if (!window.livekitClient) {
            window.livekitClient = await import('https://unpkg.com/livekit-client/dist/livekit-client.esm.js');
        }
        const { Room } = window.livekitClient;
        viewerRoom = new Room();
        viewerRoom.on('trackSubscribed', (track) => {
            if (track.kind === 'video') {
                track.attach(document.getElementById('player-video'));
            } else if (track.kind === 'audio') {
                track.attach(document.getElementById('player-video'));
            }
        });

        await viewerRoom.connect(url, token);
        // Attach already published tracks
        viewerRoom.participants.forEach(p => {
            p.tracks.forEach(pub => {
                if (pub.track) viewerRoom.emit('trackSubscribed', pub.track);
            });
        });

        currentPlayingStreamId = streamId;
        await api.request(`/streams/${streamId}/watch`, {
            method: 'POST',
            body: JSON.stringify({ action: 'start' }),
        });

        showElement('player-modal');
    } catch (err) {
        console.error('view stream error', err);
        showNotification('Erro ao abrir stream: ' + err.message, 'error');
    }
}

function closePlayer() {
    hideElement('player-modal');
    if (viewerRoom) {
        viewerRoom.disconnect();
        viewerRoom = null;
    }
    if (currentPlayingStreamId) {
        api.request(`/streams/${currentPlayingStreamId}/watch`, {
            method: 'POST',
            body: JSON.stringify({ action: 'stop' }),
        });
        currentPlayingStreamId = null;
    }
}

// Wallet functions
async function loadWallet() {
    if (!currentUser) return;
    
    try {
        const response = await api.getWallet();
        const balance = response.data.balance || 0;
        
        const balanceElements = document.querySelectorAll('#wallet-balance');
        balanceElements.forEach(el => {
            el.textContent = `${balance} moedas`;
        });
        
        const walletElements = document.querySelectorAll('.wallet-balance');
        walletElements.forEach(el => {
            el.textContent = `${balance} coins`;
        });
        
        currentUser.walletBalance = balance;
        
    } catch (error) {
        console.error('Error loading wallet:', error);
        showNotification('Erro ao carregar carteira: ' + error.message, 'error');
    }
}

async function purchaseCoins(packageType) {
    if (!currentUser) {
        showNotification('Faça login para comprar moedas', 'error');
        return;
    }
    
    try {
        const response = await api.purchaseCoins(packageType);
        const { coins, newBalance } = response.data;
        
        currentUser.walletBalance = newBalance;
        updateAuthUI();
        loadWallet();
        
        showNotification(`Compra realizada! +${coins} moedas adicionadas`, 'success');
        
    } catch (error) {
        console.error('Purchase error:', error);
        showNotification('Erro na compra: ' + error.message, 'error');
    }
}

// Demo functions
function fillDemoCredentials(type = 'streamer') {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (emailInput && passwordInput) {
        if (type === 'streamer') {
            emailInput.value = 'demo@livehot.app';
        } else {
            emailInput.value = 'viewer@livehot.app';
        }
        passwordInput.value = 'password123';
        
        announceToScreenReader('Credenciais demo preenchidas');
    }
}

function toggleAuth() {
    const loginPage = document.getElementById('login-page');
    const registerPage = document.getElementById('register-page');
    
    if (loginPage && registerPage) {
        loginPage.classList.toggle('hidden');
        registerPage.classList.toggle('hidden');
        
        const isLoginVisible = !loginPage.classList.contains('hidden');
        announceToScreenReader(isLoginVisible ? 'Formulário de login' : 'Formulário de registro');
    }
}

// Additional stream interaction functions
function likeStream(streamId) {
    showNotification('Curtida enviada!', 'success');
    announceToScreenReader('Stream curtida');
}

function shareStream(streamId) {
    if (navigator.share) {
        navigator.share({
            title: 'LiveHot Stream',
            url: `${window.location.origin}/stream/${streamId}`
        });
    } else {
        navigator.clipboard.writeText(`${window.location.origin}/stream/${streamId}`);
        showNotification('Link copiado!', 'success');
    }
    announceToScreenReader('Stream compartilhada');
}

// PWA and analytics functions
let deferredInstall;
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('service-worker.js');
            if ('PushManager' in window && window.VAPID_PUBLIC_KEY) {
                subscribePush(registration);
            }
        } catch (e) {
            console.warn('SW registration failed', e);
        }
    }
}

async function subscribePush(reg) {
    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;
        const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(window.VAPID_PUBLIC_KEY)
        });
        console.log('Push subscribed', sub);
    } catch (err) {
        console.warn('Push subscription failed', err);
    }
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredInstall = e;
    const btn = document.getElementById('install-btn');
    if (btn) btn.classList.remove('hidden');
});

async function installApp() {
    if (!deferredInstall) return;
    deferredInstall.prompt();
    await deferredInstall.userChoice;
    deferredInstall = null;
    const btn = document.getElementById('install-btn');
    if (btn) btn.classList.add('hidden');
}

async function loadAnalytics() {
    try {
        const response = await api.request('/analytics');
        const pre = document.getElementById('analytics-data');
        if (pre) {
            pre.textContent = JSON.stringify(response.data, null, 2);
        }
    } catch (err) {
        console.error('Analytics error', err);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize accessibility features
    applyContrast();
    
    // Initialize theme before anything else
    applyTheme(loadStoredTheme());
    
    // Initialize app
    await checkAuth();
    
    // Initialize captions
    const video = document.getElementById('broadcast-video');
    if (video && video.textTracks[0]) {
        video.textTracks[0].mode = 'hidden';
    }
    
    // Show navigation and hide loading
    hideElement('loading');
    showElement('app');
    
    if (currentUser) {
        showElement('navigation');
        showPage('home');
    } else {
        showPage('login');
    }
    
    // Start login reminder timer
    if (!currentUser) {
        startLoginTimer();
    }

    // Initialize PWA features
    registerServiceWorker();

    const installBtn = document.getElementById('install-btn');
    if (installBtn) installBtn.addEventListener('click', installApp);

    const analyticsBtn = document.getElementById('open-analytics');
    if (analyticsBtn) analyticsBtn.addEventListener('click', () => {
        loadAnalytics();
        showPage('analytics');
    });
    
    // Login modal handlers
    const loginModalLogin = document.getElementById("login-modal-login");
    const loginModalContinue = document.getElementById("login-modal-continue");
    
    if (loginModalLogin) {
        loginModalLogin.addEventListener("click", () => { 
            cancelLoginTimer(); 
            showPage("login"); 
        });
    }
    
    if (loginModalContinue) {
        loginModalContinue.addEventListener("click", () => { 
            cancelLoginTimer(); 
            startLoginTimer(5); 
        });
    }
    
    // Touch gestures for mobile
    const feed = document.getElementById("feed");
    if (feed) {
        let touchStartY = 0;
        feed.addEventListener("touchstart", e => {
            touchStartY = e.touches[0].clientY;
        });
        feed.addEventListener("touchend", e => {
            const diff = e.changedTouches[0].clientY - touchStartY;
            if (diff > 50) {
                feed.scrollBy({top: -window.innerHeight, behavior: "smooth"});
            } else if (diff < -50) {
                feed.scrollBy({top: window.innerHeight, behavior: "smooth"});
            }
        });

        // Infinite scroll
        feed.addEventListener('scroll', () => {
            if (feed.scrollTop + feed.clientHeight >= feed.scrollHeight - 50) {
                loadMoreStreams();
            }
        });
    }

    // Keyboard navigation for feed (accessibility)
    document.addEventListener('keydown', e => {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
        
        const feed = document.getElementById("feed");
        if (!feed) return;
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            feed.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
            announceToScreenReader('Próxima stream');
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            feed.scrollBy({ top: -window.innerHeight, behavior: 'smooth' });
            announceToScreenReader('Stream anterior');
        }
    });

    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email')?.value;
            const password = document.getElementById('password')?.value;
            const errorElement = document.getElementById('login-error');
            
            if (!email || !password) {
                if (errorElement) {
                    errorElement.textContent = 'Por favor, preencha todos os campos';
                    errorElement.classList.remove('hidden');
                }
                return;
            }
            
            try {
                const response = await api.login(email, password);
                localStorage.setItem('token', response.data.token);
                currentUser = response.data.user;
                
                // Apply user's theme
                const theme = { 
                    mode: currentUser.theme || 'dark', 
                    accentColor: currentUser.accentColor || defaultTheme.accentColor, 
                    special: currentUser.specialTheme || '' 
                };
                applyTheme(theme);
                storeTheme(theme);
                
                updateAuthUI();
                cancelLoginTimer();

                showPage('home');
                showNotification('Login realizado com sucesso!', 'success');
                
                // Clear form
                document.getElementById('email').value = '';
                document.getElementById('password').value = '';
                if (errorElement) errorElement.classList.add('hidden');
                
            } catch (error) {
                if (errorElement) {
                    errorElement.textContent = error.message;
                    errorElement.classList.remove('hidden');
                }
            }
        });
    }

    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('reg-email')?.value;
            const password = document.getElementById('reg-password')?.value;
            const username = document.getElementById('reg-username')?.value;
            const displayName = document.getElementById('reg-display-name')?.value;
            const errorElement = document.getElementById('register-error');
            
            if (!email || !password || !username || !displayName) {
                if (errorElement) {
                    errorElement.textContent = 'Por favor, preencha todos os campos';
                    errorElement.classList.remove('hidden');
                }
                return;
            }
            
            try {
                const response = await api.register(email, password, username, displayName);
                localStorage.setItem('token', response.data.token);
                currentUser = response.data.user;
                
                updateAuthUI();
                showPage('home');
                showNotification('Registro realizado com sucesso!', 'success');
                
                // Clear form
                registerForm.reset();
                if (errorElement) errorElement.classList.add('hidden');
                
            } catch (error) {
                if (errorElement) {
                    errorElement.textContent = error.message;
                    errorElement.classList.remove('hidden');
                }
            }
        });
    }

    // Media controls
    const cameraBtn = document.getElementById('camera-btn');
    const micBtn = document.getElementById('mic-btn');
    const startStreamBtn = document.getElementById('start-stream-btn');
    const captionBtn = document.getElementById('caption-btn');
    const playerClose = document.getElementById('player-close');
    
    if (cameraBtn) cameraBtn.addEventListener('click', toggleCamera);
    if (micBtn) micBtn.addEventListener('click', toggleMic);
    if (startStreamBtn) startStreamBtn.addEventListener('click', startStreamBroadcast);
    if (captionBtn) captionBtn.addEventListener('click', toggleCaptions);
    if (playerClose) playerClose.addEventListener('click', closePlayer);

    // Profile controls
    const saveProfileBtn = document.getElementById('save-profile');
    const avatarUrlInput = document.getElementById('avatar-url');
    
    if (saveProfileBtn) saveProfileBtn.addEventListener('click', saveProfile);
    if (avatarUrlInput) {
        avatarUrlInput.addEventListener('input', e => {
            const profileAvatar = document.getElementById('profile-avatar');
            if (profileAvatar) {
                profileAvatar.src = e.target.value;
                profileAvatar.alt = `Avatar de ${currentUser?.displayName || 'usuário'}`;
            }
        });
    }
});

// Make functions global for onclick handlers
window.showPage = showPage;
window.fillDemoCredentials = fillDemoCredentials;
window.toggleAuth = toggleAuth;
window.purchaseCoins = purchaseCoins;
window.saveProfile = saveProfile;
window.logout = logout;
window.loadStreams = loadStreams;
window.openStream = openStream;
window.closePlayer = closePlayer;
window.toggleContrast = toggleContrast;
window.toggleCaptions = toggleCaptions;
window.likeStream = likeStream;
window.shareStream = shareStream;
window.installApp = installApp;
