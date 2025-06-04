import React from 'react';
import ChatBox from './ChatBox';

function ChatOverlay({ isOpen, messages = [], onSendMessage }) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 flex flex-col justify-end pointer-events-none">
      <div className="pointer-events-auto">
        <ChatBox messages={messages} onSendMessage={onSendMessage} />
      </div>
    </div>
  );
}

export default ChatOverlay;
