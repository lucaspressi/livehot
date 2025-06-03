import { createSlice } from '@reduxjs/toolkit';

const streamSlice = createSlice({
  name: 'stream',
  initialState: { streams: [], current: null },
  reducers: {
    addStream(state, action) {
      state.streams.push(action.payload);
    },
    setCurrentStream(state, action) {
      state.current = action.payload;
    },
    setStreams(state, action) {
      state.streams = action.payload;
    },
  },
});

export const { addStream, setCurrentStream, setStreams } = streamSlice.actions;

export default streamSlice.reducer;
