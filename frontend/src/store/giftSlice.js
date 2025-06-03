import { createSlice } from '@reduxjs/toolkit';

const giftSlice = createSlice({
  name: 'gift',
  initialState: { gifts: [] },
  reducers: {
    addGift(state, action) {
      state.gifts.push(action.payload);
    },
    clearGifts(state) {
      state.gifts = [];
    },
  },
});

export const { addGift, clearGifts } = giftSlice.actions;

export default giftSlice.reducer;
