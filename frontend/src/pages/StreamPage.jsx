import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import ChatBox from '../components/chat/ChatBox';
import LoadingSpinner from '../components/common/LoadingSpinner';
import useStreams from '../hooks/useStreams';

function StreamPage() {
  const { id } = useParams();
  const { getStream } = useStreams();
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getStream(id);
        setStream(data);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [getStream, id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!stream) {
    return <div className="text-center p-10 text-white">Stream não encontrado</div>;
  }

  return (
    <div className="min-h-screen bg-black relative">
      <VideoPlayer url={stream.url} title={stream.title} />
      <div className="absolute top-0 right-0 h-full w-80 pointer-events-none">
        <ChatBox />
      </div>
    </div>
  );
}

export default StreamPage;
