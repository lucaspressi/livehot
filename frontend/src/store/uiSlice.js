import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Modais
  showLogin: false,
  showRegister: false,
  showGiftModal: false,
  
  // Notificações
  notifications: [],
  
  // Loading states
  loading: {
    global: false,
    auth: false,
    streams: false,
    chat: false,
  },
  
  // Sidebar/Menu states
  sidebarOpen: false,
  
  // Theme
  theme: 'dark',
  
  // Chat
  chatVisible: true,
  
  // Outras UI states
  videoQuality: 'auto',
  volume: 1,
  muted: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    loading: false,
    error: null,
    showLogin: false,
    showRegister: false,
    notifications: [],
  },
  reducers: {
    // Modal actions
    setShowLogin: (state, action) => {
      state.showLogin = action.payload;
    },
    setShowRegister: (state, action) => {
      state.showRegister = action.payload;
    },
    setShowGiftModal: (state, action) => {
      state.showGiftModal = action.payload;
    },
    
    // Notification actions
    addNotification: (state, action) => {
      const notification = {
        id: Date.now().toString(),
        type: 'info',
        title: '',
        message: '',
        duration: 5000,
        ...action.payload,
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    // Loading actions
    setLoading: (state, action) => {
      const { key, value } = action.payload;
      state.loading[key] = value;
    },
    setGlobalLoading: (state, action) => {
      state.loading.global = action.payload;
    },
    
    // Sidebar actions
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    
    // Theme actions
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },
    
    // Chat actions
    setChatVisible: (state, action) => {
      state.chatVisible = action.payload;
    },
    toggleChat: (state) => {
      state.chatVisible = !state.chatVisible;
    },
    
    // Video player actions
    setVideoQuality: (state, action) => {
      state.videoQuality = action.payload;
    },
    setVolume: (state, action) => {
      state.volume = action.payload;
    },
    setMuted: (state, action) => {
      state.muted = action.payload;
    },
    toggleMute: (state) => {
      state.muted = !state.muted;
    },
    
    // Quick actions
    openLoginModal: (state) => {
      state.showLogin = true;
      state.showRegister = false;
    },
    openRegisterModal: (state) => {
      state.showLogin = false;
      state.showRegister = true;
    },
    closeAllModals: (state) => {
      state.showLogin = false;
      state.showRegister = false;
      state.showGiftModal = false;
    },
    
    // Toast notifications helpers
    showSuccess: (state, action) => {
      const notification = {
        id: Date.now().toString(),
        type: 'success',
        title: 'Sucesso',
        message: action.payload,
        duration: 3000,
      };
      state.notifications.push(notification);
    },
    showError: (state, action) => {
      const notification = {
        id: Date.now().toString(),
        type: 'error',
        title: 'Erro',
        message: action.payload,
        duration: 5000,
      };
      state.notifications.push(notification);
    },
    showInfo: (state, action) => {
      const notification = {
        id: Date.now().toString(),
        type: 'info',
        title: 'Informação',
        message: action.payload,
        duration: 4000,
      };
      state.notifications.push(notification);
    },
    setShowLogin(state, action) {
      state.showLogin = action.payload;
    },
    setShowRegister(state, action) {
      state.showRegister = action.payload;
    },
    addNotification(state, action) {
      state.notifications.push(action.payload);
    },
    removeNotification(state, action) {
      state.notifications = state.notifications.filter(
        (n) => n.id !== action.payload
      );
    },
  },
});

export const {
  // Modal actions
  setShowLogin,
  setShowRegister,
  setShowGiftModal,
  openLoginModal,
  openRegisterModal,
  closeAllModals,
  
  // Notification actions
  addNotification,
  removeNotification,
  clearNotifications,
  showSuccess,
  showError,
  showInfo,
  
  // Loading actions
  setLoading,
  setGlobalLoading,
  
  // Sidebar actions
  setSidebarOpen,
  toggleSidebar,
  
  // Theme actions
  setTheme,
  toggleTheme,
  
  // Chat actions
  setChatVisible,
  toggleChat,
  
  // Video actions
  setVideoQuality,
  setVolume,
  setMuted,
  toggleMute,
} = uiSlice.actions;

export default uiSlice.reducer;