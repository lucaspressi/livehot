import React, { useState } from 'react';

function ChatInput({ onSend }) {
  const [value, setValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    if (onSend) {
      onSend(value);
    }
    setValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex border-t p-2">
      <input
        type="text"
        className="flex-grow p-2 border rounded mr-2"
        placeholder="Digite sua mensagem..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit" className="px-4 py-2 bg-pink-600 text-white rounded">
        Enviar
      </button>
    </form>
  );
}

export default ChatInput;
