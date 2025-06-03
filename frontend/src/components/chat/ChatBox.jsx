import React from 'react';
import useChat from '../../hooks/useChat';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

function ChatBox() {
  const { messages, sendMessage } = useChat(
    import.meta.env.VITE_WS_URL || 'ws://localhost:5000'
  );

  return (
    <div className="flex flex-col h-64 border-t">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-slate-500">Chat em tempo real</p>
        )}
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
      </div>
      <ChatInput onSend={sendMessage} />
    </div>
  );
}

export default ChatBox;
