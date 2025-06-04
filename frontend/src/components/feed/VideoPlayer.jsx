import React from 'react';
import ReactPlayer from 'react-player';
import VideoOverlay from './VideoOverlay';

function VideoPlayer({ url, title }) {
  return (
    <div className="relative w-full h-64 bg-black">
      <ReactPlayer url={url} width="100%" height="100%" controls />
      <VideoOverlay title={title} />
    </div>
  );
}

export default VideoPlayer;
