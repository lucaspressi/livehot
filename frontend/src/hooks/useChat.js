import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

export default function useChat(url) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const s = io(url);
    setSocket(s);
    s.on('message', (msg) => {
      setMessages((m) => [...m, msg]);
    });
    return () => {
      s.disconnect();
    };
  }, [url]);

  const sendMessage = useCallback(
    (msg) => {
      if (socket) {
        socket.emit('message', msg);
      }
    },
    [socket]
  );

  return { socket, messages, sendMessage };
}
