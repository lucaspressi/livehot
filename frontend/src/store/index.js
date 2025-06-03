import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import streamReducer from './streamSlice';
import giftReducer from './giftSlice';
import uiReducer from './uiSlice';
import chatReducer from './chatSlice';

export default configureStore({
  reducer: {
    auth: authReducer,
    stream: streamReducer,
    gift: giftReducer,
    ui: uiReducer,
    chat: chatReducer,
  },
});
