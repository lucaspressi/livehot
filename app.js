// API Configuration
const API_BASE_URL = window.API_BASE_URL || '/api';

// Global state
let currentUser = null;
let currentStream = null;
let cameraEnabled = false;
let micEnabled = false;
let livekitRoom = null;

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

    async getCurrentUser() {
        return this.request('/auth/me');
    },

    // Streams
    async getStreams(page = 1, limit = 20) {
        return this.request(`/streams?page=${page}&limit=${limit}`);
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
};

// Utility functions
function showElement(id) {
    document.getElementById(id).classList.remove('hidden');
}

function hideElement(id) {
    document.getElementById(id).classList.add('hidden');
}

function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });

    // Hide live broadcast UI when leaving broadcast page
    if (pageId !== 'broadcast') {
        hideElement('broadcast-session');
    }
    
    // Show selected page
    showElement(`${pageId}-page`);
    
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('text-white');
        btn.classList.add('text-slate-400');
    });
    
    // Load page content
    switch(pageId) {
        case 'home':
            loadStreams();
            break;
        case 'wallet':
            loadWallet();
            break;
        case 'broadcast':
            if (!currentUser?.isStreamer) {
                showPage('home');
                alert('Apenas streamers podem acessar esta página');
                return;
            }
            if (livekitRoom) {
                showElement('broadcast-session');
            }
            break;
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg text-white max-w-sm ${
        type === 'error' ? 'bg-red-600' : 
        type === 'success' ? 'bg-green-600' : 
        'bg-blue-600'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Auth functions
async function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await api.getCurrentUser();
            currentUser = response.data;
            updateAuthUI();
            return true;
        } catch (error) {
            localStorage.removeItem('token');
            currentUser = null;
        }
    }
    updateAuthUI();
    return false;
}

function updateAuthUI() {
    const authNav = document.getElementById('auth-nav');
    const authText = document.getElementById('auth-text');
    const broadcastNav = document.getElementById('broadcast-nav');
    
    if (currentUser) {
        authText.textContent = 'Sair';
        if (currentUser.isStreamer) {
            broadcastNav.classList.remove('hidden');
        }
    } else {
        authText.textContent = 'Login';
        broadcastNav.classList.add('hidden');
    }
}

function toggleAuth() {
    if (currentUser) {
        logout();
    } else {
        showPage('login');
    }
}

function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    updateAuthUI();
    showPage('home');
    showNotification('Logout realizado com sucesso!', 'success');
}

function fillDemoCredentials(type) {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (type === 'streamer') {
        emailInput.value = 'demo@livehot.app';
        passwordInput.value = 'password123';
    } else {
        emailInput.value = 'viewer@livehot.app';
        passwordInput.value = 'password123';
    }
}

// Stream functions
async function loadStreams() {
    const container = document.getElementById('streams-container');
    
    try {
        container.innerHTML = `
            <div class="text-center text-slate-400 py-12">
                <div class="animate-pulse text-4xl mb-4">📹</div>
                <p>Carregando streams...</p>
            </div>
        `;
        
        const response = await api.getStreams();
        const streams = response.data.streams;
        
        if (streams.length === 0) {
            container.innerHTML = `
                <div class="text-center text-slate-400 py-12">
                    <div class="text-4xl mb-4">📹</div>
                    <p>Nenhuma stream ativa no momento</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${streams.map(stream => `
                    <div class="bg-slate-800 rounded-lg overflow-hidden shadow-lg">
                        <div class="relative">
                            <img 
                                src="${stream.thumbnailUrl}" 
                                alt="${stream.title}"
                                class="w-full h-48 object-cover"
                                onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmaWxsPSIjOTQ5NmE4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9InN5c3RlbS11aSIgZm9udC1zaXplPSIxOCI+TGl2ZSBTdHJlYW08L3RleHQ+Cjwvc3ZnPg=='"
                            />
                            <div class="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                                LIVE
                            </div>
                            <div class="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                                👥 ${stream.viewerCount}
                            </div>
                        </div>
                        <div class="p-4">
                            <h3 class="text-white font-semibold mb-2 line-clamp-2">${stream.title}</h3>
                            <div class="flex items-center gap-2 mb-2">
                                <img 
                                    src="${stream.streamer.avatarUrl}" 
                                    alt="${stream.streamer.displayName}"
                                    class="w-6 h-6 rounded-full"
                                    onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9IiM2MzY2ZjEiLz4KPHN2ZyB4PSI2IiB5PSI2IiB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0yMCAyMXYtMmE0IDQgMCAwIDAtNC00SDhhNCA0IDAgMCAwLTQgNHYyIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8Y2lyY2xlIGN4PSIxMiIgY3k9IjciIHI9IjQiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo8L3N2Zz4K'"
                                />
                                <span class="text-slate-300 text-sm">${stream.streamer.displayName}</span>
                                ${stream.streamer.isVerified ? '<span class="text-blue-400 text-xs">✓</span>' : ''}
                            </div>
                            <span class="text-slate-400 text-xs">${stream.category}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
    } catch (error) {
        container.innerHTML = `
            <div class="text-center text-red-400 py-12">
                <div class="text-4xl mb-4">❌</div>
                <p>Erro ao carregar streams: ${error.message}</p>
                <button onclick="loadStreams()" class="mt-4 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded">
                    Tentar Novamente
                </button>
            </div>
        `;
    }
}

// Wallet functions
async function loadWallet() {
    const balanceElement = document.getElementById('wallet-balance');
    
    if (currentUser) {
        balanceElement.textContent = `${currentUser.walletBalance || 0} moedas`;
    } else {
        balanceElement.textContent = '0 moedas';
    }
}

async function purchaseCoins(packageType) {
    if (!currentUser) {
        showNotification('Faça login para comprar moedas', 'error');
        return;
    }
    
    try {
        const response = await api.purchaseCoins(packageType);
        currentUser.walletBalance = response.data.newBalance;
        loadWallet();
        showNotification(`${response.data.coins} moedas adicionadas com sucesso!`, 'success');
    } catch (error) {
        showNotification('Erro ao comprar moedas: ' + error.message, 'error');
    }
}

// Broadcast functions
function toggleCamera() {
    cameraEnabled = !cameraEnabled;
    const btn = document.getElementById('camera-btn');
    
    if (cameraEnabled) {
        btn.textContent = '📹 Câmera Ligada';
        btn.className = 'flex items-center gap-2 px-4 py-2 rounded transition-colors bg-green-600 hover:bg-green-700 text-white';
        
        // Try to access camera
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    console.log('Camera access granted:', stream);
                    showNotification('Câmera ativada com sucesso!', 'success');
                })
                .catch(err => {
                    console.log('Camera access denied:', err);
                    showNotification('Acesso à câmera negado ou não disponível', 'error');
                    cameraEnabled = false;
                    btn.textContent = '📹 Câmera Desligada';
                    btn.className = 'flex items-center gap-2 px-4 py-2 rounded transition-colors bg-slate-600 hover:bg-slate-700 text-white';
                });
        }
    } else {
        btn.textContent = '📹 Câmera Desligada';
        btn.className = 'flex items-center gap-2 px-4 py-2 rounded transition-colors bg-slate-600 hover:bg-slate-700 text-white';
    }
}

function toggleMic() {
    micEnabled = !micEnabled;
    const btn = document.getElementById('mic-btn');
    
    if (micEnabled) {
        btn.textContent = '🎤 Microfone Ligado';
        btn.className = 'flex items-center gap-2 px-4 py-2 rounded transition-colors bg-green-600 hover:bg-green-700 text-white';
    } else {
        btn.textContent = '🎤 Microfone Desligado';
        btn.className = 'flex items-center gap-2 px-4 py-2 rounded transition-colors bg-slate-600 hover:bg-slate-700 text-white';
    }
}

async function startStreamBroadcast() {
    if (!currentStream) {
        showNotification('Nenhuma stream criada', 'error');
        return;
    }

    try {
        const response = await api.startBroadcast(currentStream.id);
        const { url, token } = response.data;

        if (window.livekitClient) {
            const { connect, createLocalTracks } = window.livekitClient;
            livekitRoom = await connect(url, token);
            const tracks = await createLocalTracks({
                audio: micEnabled,
                video: cameraEnabled,
            });
            tracks.forEach(track => {
                livekitRoom.localParticipant.publishTrack(track);
                if (track.kind === 'video') {
                    track.attach(document.getElementById('broadcast-video'));
                }
            });
        }

        showNotification('Stream iniciada com sucesso!', 'success');
        showElement('broadcast-session');
    } catch (error) {
        showNotification('Erro ao iniciar stream: ' + error.message, 'error');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize app
    await checkAuth();
    
    // Show navigation and hide loading
    hideElement('loading');
    showElement('app');
    showElement('navigation');
    
    // Show home page by default
    showPage('home');
    
    // Login form
    document.getElementById('login-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorElement = document.getElementById('login-error');
        
        try {
            const response = await api.login(email, password);
            localStorage.setItem('token', response.data.token);
            currentUser = response.data.user;
            updateAuthUI();
            showPage('home');
            showNotification('Login realizado com sucesso!', 'success');
            
            // Clear form
            document.getElementById('email').value = '';
            document.getElementById('password').value = '';
            errorElement.classList.add('hidden');
            
        } catch (error) {
            errorElement.textContent = error.message;
            errorElement.classList.remove('hidden');
        }
    });
    
    // Stream form
    document.getElementById('stream-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const title = document.getElementById('stream-title').value;
        const description = document.getElementById('stream-description').value;
        const category = document.getElementById('stream-category').value;
        const isPrivate = document.getElementById('stream-private').checked;
        
        if (!title.trim()) {
            showNotification('Título é obrigatório', 'error');
            return;
        }
        
        try {
            const response = await api.createStream({
                title,
                description,
                category,
                isPrivate,
            });
            
            currentStream = response.data;
            
            // Show stream info
            document.getElementById('stream-info').innerHTML = `
                <p><strong>Título:</strong> ${currentStream.title}</p>
                <p><strong>ID:</strong> ${currentStream.id}</p>
                <p><strong>Status:</strong> ${currentStream.isLive ? 'Ao Vivo' : 'Aguardando'}</p>
            `;
            
            // Hide form and show controls
            hideElement('stream-form-container');
            showElement('stream-controls');
            
            showNotification('Stream criada com sucesso!', 'success');
            
        } catch (error) {
            showNotification('Erro ao criar stream: ' + error.message, 'error');
        }
    });
    
    // Media controls
    document.getElementById('camera-btn').addEventListener('click', toggleCamera);
    document.getElementById('mic-btn').addEventListener('click', toggleMic);
    document.getElementById('start-stream-btn').addEventListener('click', startStreamBroadcast);
});

// Make functions global for onclick handlers
window.showPage = showPage;
window.fillDemoCredentials = fillDemoCredentials;
window.toggleAuth = toggleAuth;
window.purchaseCoins = purchaseCoins;

