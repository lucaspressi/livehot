import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import VideoPlayer from '../components/feed/VideoPlayer';
import ChatBox from '../components/chat/ChatBox';
import GiftButton from '../components/gifts/GiftButton';
import LoadingSpinner from '../components/common/LoadingSpinner';
import useAuth from '../hooks/useAuth';
import useStreams from '../hooks/useStreams';

function StreamPage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { getStreamById } = useStreams();
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStream = async () => {
      try {
        setLoading(true);
        const streamData = await getStreamById(id);
        setStream(streamData);
      } catch (error) {
        console.error('Erro ao carregar stream:', error);
        setStream(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadStream();
    }
  }, [id, getStreamById]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <h2 className="text-2xl mb-4">Stream não encontrado</h2>
          <p className="text-gray-400">O stream que você está procurando não existe ou foi encerrado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Video player principal */}
      <div className="w-full h-screen">
        <VideoPlayer 
          stream={stream}
          autoplay={true}
          controls={true}
        />
      </div>
      
      {/* Chat lateral */}
      <div className="absolute top-0 right-0 h-full w-80 bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-white font-bold">{stream.title}</h3>
          <p className="text-gray-400 text-sm">{stream.streamer?.name}</p>
          <p className="text-gray-500 text-xs">{stream.viewerCount || 0} viewers</p>
        </div>
        <ChatBox streamId={id} />
      </div>
      
      {/* Botões de ação flutuantes */}
      <div className="absolute bottom-20 right-96 flex flex-col gap-4 z-10">
        <GiftButton streamId={id} />
        
        {/* Botão de like */}
        <button className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg transition-colors">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        </button>
        
        {/* Botão de compartilhar */}
        <button className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-colors">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
        </button>
      </div>
      
      {/* Header com informações */}
      <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 backdrop-blur-sm rounded-lg p-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {stream.streamer?.name?.charAt(0) || 'S'}
            </span>
          </div>
          <div>
            <h4 className="text-white font-semibold">{stream.streamer?.name}</h4>
            <p className="text-gray-400 text-sm">{stream.category}</p>
          </div>
          {!isAuthenticated ? (
            <button className="ml-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
              Seguir
            </button>
          ) : user?.id !== stream.streamer?.id && (
            <button className="ml-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
              Seguir
            </button>
          )}
        </div>
      </div>
      
      {/* Botão voltar */}
      <div className="absolute top-4 left-4 z-20">
        <button 
          onClick={() => window.history.back()}
          className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default StreamPage;