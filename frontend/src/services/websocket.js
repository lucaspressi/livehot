import { io } from 'socket.io-client';

let socket = null;

export function connect(url = import.meta.env.VITE_WS_URL || 'ws://localhost:5000') {
  socket = io(url);
  return socket;
}

export function disconnect() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function on(event, callback) {
  if (socket) {
    socket.on(event, callback);
  }
}

export function emit(event, payload) {
  if (socket) {
    socket.emit(event, payload);
  }
}

export default { connect, disconnect, on, emit };
