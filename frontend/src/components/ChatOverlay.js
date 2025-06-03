import React, { useState } from 'react';

function ChatOverlay() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim()) return;
    setMessages([...messages, text.trim()]);
    setText('');
  };

  return (
    <div className="absolute bottom-0 right-0 m-2 w-64 bg-black/60 p-2 rounded text-sm">
      <div className="h-32 overflow-y-auto mb-2 space-y-1">
        {messages.map((msg, idx) => (
          <div key={idx} className="text-white">{msg}</div>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 px-1 text-black rounded"
          placeholder="Digite..."
        />
        <button onClick={handleSend} className="px-2 bg-pink-500 text-white rounded">
          Enviar
        </button>
      </div>
    </div>
  );
}

export default ChatOverlay;
