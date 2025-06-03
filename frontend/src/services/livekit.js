import { connect } from '@livekit/client';

let room = null;

export async function connectToRoom(token, options = {}) {
  const url = import.meta.env.VITE_LIVEKIT_WS_URL || 'wss://localhost:7880';
  room = await connect(url, token, options);
  return room;
}

export function getRoom() {
  return room;
}

export function on(event, callback) {
  if (room) {
    room.on(event, callback);
  }
}

export function disconnect() {
  if (room) {
    room.disconnect();
    room = null;
  }
}

export default { connectToRoom, disconnect, on, getRoom };
