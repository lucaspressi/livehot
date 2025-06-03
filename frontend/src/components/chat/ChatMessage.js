import React from 'react';

function ChatMessage({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start space-x-2 py-1">
      {message.user && (
        <span className="font-semibold">{message.user}:</span>
      )}
      <span>{message.text}</span>
    </div>
  );
}

export default ChatMessage;
