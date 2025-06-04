import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoPlayer from '../components/feed/VideoPlayer';
import ChatBox from '../components/chat/ChatBox';
import GiftButton from '../components/gifts/GiftButton';
import LoadingSpinner from '../components/common/LoadingSpinner';
import useAuth from '../hooks/useAuth';
import useStreams from '../hooks/useStreams';

function StreamPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { getStreamById } = useStreams();
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const loadStream = async () => {
      try {
        setLoading(true);
        const streamData = await getStreamById(id);
        setStream(streamData);
        
        // Verificar se já está seguindo o streamer
        if (isAuthenticated && user?.id && streamData?.streamer?.id) {
          // Aqui você pode fazer uma verificação se o usuário já segue o streamer
          // setIsFollowing(checkIfFollowing(user.id, streamData.streamer.id));
        }
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
  }, [id, getStreamById, isAuthenticated, user?.id]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    // Implementar lógica de like aqui
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      // Redirecionar para login ou mostrar modal de login
      return;
    }
    
    try {
      setIsFollowing(!isFollowing);
      // Implementar lógica de seguir/não seguir aqui
    } catch (error) {
      console.error('Erro ao seguir/não seguir:', error);
      setIsFollowing(!isFollowing); // Reverter em caso de erro
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: stream.title,
          text: `Assista ao stream de ${stream.streamer?.name}`,
          url: window.location.href,
        });
      } else {
        // Fallback: copiar URL para clipboard
        await navigator.clipboard.writeText(window.location.href);
        // Mostrar toast de sucesso
        console.log('Link copiado para clipboard!');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

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
          <p className="text-gray-400 mb-6">
            O stream que você está procurando não existe ou foi encerrado.
          </p>
          <button 
            onClick={handleGoBack}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const isOwnStream = isAuthenticated && user?.id === stream.streamer?.id;

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
      <div className="absolute top-0 right-0 h-full w-80 bg-black bg-opacity-50 backdrop-blur-sm border-l border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-white font-bold truncate">{stream.title}</h3>
          <p className="text-gray-400 text-sm truncate">{stream.streamer?.name}</p>
          <p className="text-gray-500 text-xs">
            {stream.viewerCount?.toLocaleString() || 0} viewers
          </p>
        </div>
        <div className="h-full pb-20"> {/* Espaço para o chat */}
          <ChatBox streamId={id} />
        </div>
      </div>
      
      {/* Botões de ação flutuantes */}
      <div className="absolute bottom-20 right-96 flex flex-col gap-4 z-10">
        <GiftButton streamId={id} />
        
        {/* Botão de like */}
        <button 
          onClick={handleLike}
          className={`${
            isLiked ? 'bg-red-600' : 'bg-red-500 hover:bg-red-600'
          } text-white p-3 rounded-full shadow-lg transition-colors`}
          title={isLiked ? 'Remover like' : 'Curtir'}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path 
              fillRule="evenodd" 
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" 
              clipRule="evenodd" 
            />
          </svg>
        </button>
        
        {/* Botão de compartilhar */}
        <button 
          onClick={handleShare}
          className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-colors"
          title="Compartilhar"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
        </button>
      </div>
      
      {/* Header com informações */}
      <div className="absolute top-20 left-4 z-10 bg-black bg-opacity-50 backdrop-blur-sm rounded-lg p-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">
              {stream.streamer?.name?.charAt(0)?.toUpperCase() || 'S'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-white font-semibold truncate">{stream.streamer?.name}</h4>
            <p className="text-gray-400 text-sm truncate">{stream.category}</p>
          </div>
          {!isOwnStream && (
            <button 
              onClick={handleFollow}
              disabled={!isAuthenticated}
              className={`ml-2 px-4 py-2 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
                isFollowing 
                  ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                  : 'bg-red-500 hover:bg-red-600 text-white'
              } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isFollowing ? 'Seguindo' : 'Seguir'}
            </button>
          )}
        </div>
      </div>
      
      {/* Botão voltar */}
      <div className="absolute top-4 left-4 z-20">
        <button 
          onClick={handleGoBack}
          className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-colors"
          title="Voltar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
      
      {/* Indicador de stream ao vivo */}
      {stream.isLive && (
        <div className="absolute top-4 right-96 z-10">
          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            AO VIVO
          </div>
        </div>
      )}
    </div>
  );
}

export default StreamPage;