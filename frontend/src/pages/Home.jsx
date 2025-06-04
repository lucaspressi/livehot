import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import VideoFeed from '../components/feed/VideoFeed';
import ChatBox from '../components/chat/ChatBox';
import GiftButton from '../components/gifts/GiftButton';
import LoadingSpinner from '../components/common/LoadingSpinner';
import useAuth from '../hooks/useAuth';
import { useStreams } from '../hooks/useStreams';

function Home() {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useAuth();
  const { streams, loading } = useStreams();

  useEffect(() => {
    // Carregar streams ao montar componente
    // dispatch(fetchStreams());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Feed principal de vídeos */}
      <VideoFeed streams={streams} />
      
      {/* Chat overlay */}
      <div className="absolute top-0 right-0 h-full w-80 pointer-events-none">
        <ChatBox />
      </div>
      
      {/* Botões de ação */}
      <div className="absolute bottom-20 right-4 flex flex-col gap-4">
        <GiftButton />
        {/* Outros botões de ação */}
      </div>
      
      {/* Header com login/logout */}
      <div className="absolute top-4 left-4 z-10">
        {!isAuthenticated ? (
          <button className="bg-blue-500 text-white px-4 py-2 rounded">
            Login
          </button>
        ) : (
          <div className="text-white">Olá, {user?.name}</div>
        )}
      </div>
    </div>
  );
}

export default Home;