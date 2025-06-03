import React from 'react';

function VideoPlayer({ src, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="relative w-full max-w-3xl">
        <video src={src} controls autoPlay className="w-full rounded" />
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-white bg-black/50 rounded-full px-2"
          >
            ✖
          </button>
        )}
      </div>
    </div>
  );
}

export default VideoPlayer;
