import { useEffect } from 'react';
import { io } from 'socket.io-client';

export default function useSocket(url) {
  useEffect(() => {
    const socket = io(url);
    return () => {
      socket.disconnect();
    };
  }, [url]);
}
