import React, { useState } from 'react';
import VideoPlayer from './components/VideoPlayer';
import ChatOverlay from './components/ChatOverlay';
import GiftModal from './components/GiftModal';
import AuthModal from './components/AuthModal';
import VideoFeed from './components/VideoFeed';

function App() {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showGifts, setShowGifts] = useState(false);

  return (
    <div className="relative min-h-screen bg-gray-900 text-white">
      <header className="p-4 flex gap-2">
        <button onClick={() => setShowAuth(true)} className="bg-slate-700 px-3 py-1 rounded">Login</button>
        <button onClick={() => setShowGifts(true)} className="bg-slate-700 px-3 py-1 rounded">Gifts</button>
      </header>
      <VideoFeed onSelect={setSelectedVideo} />
      {selectedVideo && (
        <VideoPlayer src={selectedVideo.src} onClose={() => setSelectedVideo(null)} />
      )}
      <ChatOverlay />
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showGifts && <GiftModal onClose={() => setShowGifts(false)} />}
    </div>
  );
}

export default App;
