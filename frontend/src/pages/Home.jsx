import React, { useEffect, useState } from 'react';

// API Service
const API_BASE_URL = 'http://localhost:5000/api';

const apiService = {
  // Auth
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },
  
  register: async (email, password, username, displayName) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username, displayName })
    });
    return response.json();
  },
  
  getCurrentUser: async (token) => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },
  
  // Streams
  getStreams: async (token = null, page = 1, limit = 20, category = null) => {
    const params = new URLSearchParams({ page, limit });
    if (category) params.append('category', category);
    
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}/streams?${params}`, { headers });
    return response.json();
  },
  
  getStream: async (streamId) => {
    const response = await fetch(`${API_BASE_URL}/streams/${streamId}`);
    return response.json();
  },
  
  // Gifts
  getGifts: async () => {
    const response = await fetch(`${API_BASE_URL}/gifts`);
    return response.json();
  },
  
  sendGift: async (token, giftId, recipientId) => {
    const response = await fetch(`${API_BASE_URL}/gifts/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ giftId, recipientId })
    });
    return response.json();
  },
  
  // Wallet
  getWallet: async (token) => {
    const response = await fetch(`${API_BASE_URL}/wallet`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },
  
  // Watch tracking
  watchStream: async (token, streamId, action) => {
    const response = await fetch(`${API_BASE_URL}/streams/${streamId}/watch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action })
    });
    return response.json();
  }
};

function Home() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [streams, setStreams] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(0);
  const [gifts, setGifts] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showGifts, setShowGifts] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    username: '',
    displayName: ''
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Track current stream view
  useEffect(() => {
    if (token && streams[currentVideo]) {
      const streamId = streams[currentVideo].id;
      apiService.watchStream(token, streamId, 'start');
      
      return () => {
        apiService.watchStream(token, streamId, 'stop');
      };
    }
  }, [currentVideo, streams, token]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load current user if token exists
      if (token) {
        try {
          const userResult = await apiService.getCurrentUser(token);
          if (userResult.success) {
            setUser(userResult.data);
            // Load wallet
            const walletResult = await apiService.getWallet(token);
            if (walletResult.success) {
              setWallet(walletResult.data);
            }
          }
        } catch (error) {
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      
      // Load streams
      const streamsResult = await apiService.getStreams(token);
      if (streamsResult.success) {
        setStreams(streamsResult.data.streams);
      }
      
      // Load gifts
      const giftsResult = await apiService.getGifts();
      if (giftsResult.success) {
        setGifts(giftsResult.data.gifts);
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const result = await apiService.login(loginForm.email, loginForm.password);
      if (result.success) {
        setToken(result.data.token);
        setUser(result.data.user);
        localStorage.setItem('token', result.data.token);
        setShowLogin(false);
        setLoginForm({ email: '', password: '' });
        loadInitialData();
      } else {
        alert(result.error.message);
      }
    } catch (error) {
      alert('Erro ao fazer login');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const result = await apiService.register(
        registerForm.email,
        registerForm.password,
        registerForm.username,
        registerForm.displayName
      );
      if (result.success) {
        setToken(result.data.token);
        setUser(result.data.user);
        localStorage.setItem('token', result.data.token);
        setShowLogin(false);
        setIsRegistering(false);
        setRegisterForm({ email: '', password: '', username: '', displayName: '' });
        loadInitialData();
      } else {
        alert(result.error.message);
      }
    } catch (error) {
      alert('Erro ao registrar');
    }
  };

  const handleSendGift = async (giftId) => {
    if (!token) {
      setShowLogin(true);
      return;
    }
    
    const currentStream = streams[currentVideo];
    if (!currentStream) return;
    
    try {
      const result = await apiService.sendGift(token, giftId, currentStream.streamerId);
      if (result.success) {
        setWallet(prev => ({ ...prev, balance: result.data.newBalance }));
        setShowGifts(false);
        alert(`Gift ${result.data.gift.name} enviado com sucesso!`);
      } else {
        alert(result.error.message);
      }
    } catch (error) {
      alert('Erro ao enviar gift');
    }
  };

  const handleScroll = (direction) => {
    if (direction === 'up' && currentVideo > 0) {
      setCurrentVideo(currentVideo - 1);
    } else if (direction === 'down' && currentVideo < streams.length - 1) {
      setCurrentVideo(currentVideo + 1);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setWallet(null);
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (streams.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Nenhuma stream ao vivo no momento</div>
      </div>
    );
  }

  const currentStream = streams[currentVideo];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Video Container - Fullscreen */}
      <div className="w-full h-screen relative">
        {/* Video Background */}
        <div 
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${currentStream.thumbnailUrl || 'https://picsum.photos/400/600?random=' + currentStream.id})`,
            filter: 'brightness(0.7)'
          }}
        >
          {/* Live Badge */}
          {currentStream.isLive && (
            <div className="absolute top-4 left-4 z-20">
              <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                AO VIVO
              </div>
            </div>
          )}

          {/* Navigation Arrows */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => handleScroll('up')}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all"
                disabled={currentVideo === 0}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button 
                onClick={() => handleScroll('down')}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all"
                disabled={currentVideo === streams.length - 1}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex">
          {/* Left Side - Stream Info */}
          <div className="flex-1 flex flex-col justify-end p-6 pb-32">
            <div className="text-white space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-pink-500 to-purple-500">
                  {currentStream.streamer.avatarUrl ? (
                    <img src={currentStream.streamer.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-lg">
                      {currentStream.streamer.displayName?.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{currentStream.streamer.displayName}</h3>
                  <p className="text-sm text-gray-300">{formatNumber(currentStream.viewerCount)} visualizações</p>
                </div>
                <button className="ml-4 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-full text-sm font-medium transition-colors">
                  Seguir
                </button>
              </div>
              
              <h2 className="text-xl font-bold">{currentStream.title}</h2>
              <p className="text-gray-300">{currentStream.description}</p>
              
              <div className="flex items-center gap-4 text-sm text-gray-300">
                <span>#{currentVideo + 1} de {streams.length}</span>
                <span>•</span>
                <span>{currentStream.category}</span>
                <span>•</span>
                <span>{formatNumber(currentStream.giftCount)} gifts</span>
              </div>
            </div>
          </div>

          {/* Right Side - Action Buttons */}
          <div className="w-20 flex flex-col justify-end items-center pb-32 space-y-6">
            {/* Like Button */}
            <button className="flex flex-col items-center text-white hover:scale-110 transition-transform">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-1">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-xs">{formatNumber(currentStream.viewerCount)}</span>
            </button>

            {/* Comment Button */}
            <button className="flex flex-col items-center text-white hover:scale-110 transition-transform">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <span className="text-xs">Chat</span>
            </button>

            {/* Gift Button */}
            <button 
              onClick={() => setShowGifts(true)}
              className="flex flex-col items-center text-white hover:scale-110 transition-transform"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-1">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" />
                  <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
                </svg>
              </div>
              <span className="text-xs">Gift</span>
            </button>

            {/* Share Button */}
            <button className="flex flex-col items-center text-white hover:scale-110 transition-transform">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </div>
              <span className="text-xs">Share</span>
            </button>
          </div>
        </div>

        {/* Chat Overlay - Mobile Style */}
        <div className="absolute bottom-4 left-4 right-24 z-20">
          <div className="bg-black bg-opacity-50 backdrop-blur-sm rounded-xl p-4 max-h-64 overflow-y-auto">
            <div className="space-y-2 text-white text-sm">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-blue-400">Viewer123:</span>
                <span>Que stream incrível! 🔥</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-green-400">GameFan:</span>
                <span>Adorei essa parte!</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-purple-400">MusicLover:</span>
                <span>🎵🎵🎵</span>
              </div>
            </div>
            
            {/* Chat Input */}
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder={token ? "Digite sua mensagem..." : "Faça login para enviar mensagens"}
                className="flex-1 bg-white bg-opacity-20 text-white placeholder-gray-300 px-3 py-2 rounded-full text-sm border-none outline-none"
                disabled={!token}
              />
              <button 
                className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-50"
                disabled={!token}
              >
                Enviar
              </button>
            </div>
          </div>
        </div>

        {/* Top Header */}
        <div className="absolute top-4 right-4 z-20">
          {!user ? (
            <button 
              onClick={() => setShowLogin(true)}
              className="bg-white text-black px-4 py-2 rounded-full font-medium hover:bg-gray-100 transition-colors"
            >
              Login
            </button>
          ) : (
            <div className="flex items-center gap-3 text-white">
              {wallet && (
                <div className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                  💰 {wallet.balance} coins
                </div>
              )}
              <span>Olá, {user.displayName}</span>
              <div 
                className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-pink-500 to-purple-500 cursor-pointer"
                onClick={handleLogout}
                title="Clique para sair"
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-sm">
                    {user.displayName?.charAt(0)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 space-y-2 z-20">
        {streams.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentVideo(index)}
            className={`w-2 h-8 rounded-full transition-all ${
              index === currentVideo 
                ? 'bg-white' 
                : 'bg-white bg-opacity-50 hover:bg-opacity-75'
            }`}
          />
        ))}
      </div>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{isRegistering ? 'Criar Conta' : 'Login'}</h2>
              <button 
                onClick={() => {
                  setShowLogin(false);
                  setIsRegistering(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
{!isRegistering ? (
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                />
                <input
                  type="password"
                  placeholder="Senha"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                />
                <button 
                  onClick={handleLogin}
                  className="w-full bg-pink-500 text-white py-3 rounded-lg font-medium hover:bg-pink-600"
                >
                  Entrar
                </button>
                <p className="text-center text-sm text-gray-600">
                  Não tem conta?{' '}
                  <button 
                    onClick={() => setIsRegistering(true)}
                    className="text-pink-500 hover:underline"
                  >
                    Criar conta
                  </button>
                </p>
                <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded">
                  <strong>Demo:</strong><br/>
                  Email: demo@livehot.app<br/>
                  Senha: password123
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nome de usuário"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={registerForm.displayName}
                  onChange={(e) => setRegisterForm({...registerForm, displayName: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                />
                <input
                  type="password"
                  placeholder="Senha"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                />
                <button 
                  onClick={handleRegister}
                  className="w-full bg-pink-500 text-white py-3 rounded-lg font-medium hover:bg-pink-600"
                >
                  Criar Conta
                </button>
                <p className="text-center text-sm text-gray-600">
                  Já tem conta?{' '}
                  <button 
                    onClick={() => setIsRegistering(false)}
                    className="text-pink-500 hover:underline"
                  >
                    Fazer login
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gifts Modal */}
      {showGifts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Enviar Gift</h2>
              <button 
                onClick={() => setShowGifts(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {wallet && (
              <div className="mb-4 p-3 bg-yellow-100 rounded-lg">
                <div className="text-sm text-gray-600">Seu saldo:</div>
                <div className="font-bold text-yellow-600">💰 {wallet.balance} coins</div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              {gifts.map((gift) => (
                <button
                  key={gift.id}
                  onClick={() => handleSendGift(gift.id)}
                  className={`p-4 border rounded-lg text-center hover:bg-gray-50 transition-colors ${
                    wallet && wallet.balance < gift.costCoins ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={wallet && wallet.balance < gift.costCoins}
                >
                  <div className="text-2xl mb-2">{gift.emoji}</div>
                  <div className="font-medium">{gift.name}</div>
                  <div className="text-sm text-gray-600">{gift.costCoins} coins</div>
                  <div className={`text-xs px-2 py-1 rounded-full mt-2 ${
                    gift.rarity === 'COMMON' ? 'bg-gray-200' :
                    gift.rarity === 'UNCOMMON' ? 'bg-green-200' :
                    gift.rarity === 'RARE' ? 'bg-blue-200' : 'bg-purple-200'
                  }`}>
                    {gift.rarity}
                  </div>
                </button>
              ))}
            </div>
            
            {!token && (
              <div className="mt-4 text-center">
                <button 
                  onClick={() => {
                    setShowGifts(false);
                    setShowLogin(true);
                  }}
                  className="text-pink-500 hover:underline"
                >
                  Faça login para enviar gifts
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
