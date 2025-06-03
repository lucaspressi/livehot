import React from 'react';
import VideoPlayer from '../components/VideoPlayer';
import ChatBox from '../components/chat/ChatBox';
import GiftButton from '../components/gifts/GiftButton';

function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <VideoPlayer />
      <ChatBox />
      <div className="p-4">
        <GiftButton />
      </div>
    </div>
  );
}

export default Home;
