import React from 'react';
import VideoPlayer from './VideoPlayer';

function VideoFeed({ videos = [] }) {
  if (videos.length === 0) {
    return <p className="text-center p-4 text-slate-500">Nenhum vídeo disponível</p>;
  }

  return (
    <div className="space-y-6">
      {videos.map((video, index) => (
        <VideoPlayer key={index} url={video.url} title={video.title} />
      ))}
    </div>
  );
}

export default VideoFeed;
