import { createSlice } from '@reduxjs/toolkit';

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
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
    clearError(state) {
      state.error = null;
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
  setLoading,
  setError,
  clearError,
  setShowLogin,
  setShowRegister,
  addNotification,
  removeNotification,
} = uiSlice.actions;

export default uiSlice.reducer;
