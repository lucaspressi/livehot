import { connect as livekitConnect, Room } from '@livekit/client';

let room = null;

export async function connect(url = import.meta.env.VITE_LIVEKIT_URL || 'ws://localhost:7880', token, options = {}) {
  room = new Room(options);
  await livekitConnect(url, token, { room });
  return room;
}

export function disconnect() {
  if (room) {
    room.disconnect();
    room = null;
  }
}

export function getRoom() {
  return room;
}

export default { connect, disconnect, getRoom };
