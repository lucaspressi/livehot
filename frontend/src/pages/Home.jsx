import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import VideoFeed from '../components/feed/VideoFeed';
import ChatBox from '../components/chat/ChatBox';
import GiftButton from '../components/gifts/GiftButton';
import LoadingSpinner from '../components/common/LoadingSpinner';
import useAuth from '../hooks/useAuth';
import useStreams from '../hooks/useStreams';

function Home() {
  const { user } = useAuth();
  const { streams, loading, fetchStreams } = useStreams();

  useEffect(() => {
    fetchStreams();
  }, [fetchStreams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const recipientId = streams[0]?.streamerId || '';

  return (
    <div className="min-h-screen bg-black relative">
      <VideoFeed videos={streams} />

      <div className="absolute top-0 right-0 h-full w-80 pointer-events-none">
        <ChatBox />
      </div>

      <div className="absolute bottom-20 right-4 flex flex-col gap-4">
        <GiftButton recipientId={recipientId} />
      </div>

      <div className="absolute top-4 left-4 z-10 text-white flex gap-4">
        {user ? `Olá, ${user.displayName}` : 'LiveHot'}
        <Link to="/wallet" className="underline">
          Carteira
        </Link>
      </div>
    </div>
  );
}

export default Home;
