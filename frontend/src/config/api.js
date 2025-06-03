/**
 * API endpoint definitions used throughout the app.
 * Paths are relative to the base URL configured in services/api.js
 */
const API = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
  },
  STREAMS: {
    BASE: '/streams',
    BY_ID: (id) => `/streams/${id}`,
    START: (id) => `/streams/${id}/start`,
    STOP: (id) => `/streams/${id}/stop`,
    UPDATE: (id) => `/streams/${id}/update`,
    WATCH: (id) => `/streams/${id}/watch`,
    RANKING: '/streams/ranking',
    TRENDING: '/streams/trending',
    CATEGORIES: '/streams/categories',
    RECOMMENDATIONS: '/streams/recommendations',
  },
  GIFTS: {
    LIST: '/gifts',
    SEND: '/gifts/send',
  },
  WALLET: {
    BASE: '/wallet',
    PURCHASE: '/wallet/purchase',
    TRANSACTIONS: '/wallet/transactions',
  },
  USERS: {
    BY_ID: (id) => `/users/${id}`,
    PREFERENCES: '/users/preferences',
  },
  BROADCAST: (id) => `/broadcast/${id}`,
  HEALTH: '/health',
  ANALYTICS: '/analytics',
};

export default API;
