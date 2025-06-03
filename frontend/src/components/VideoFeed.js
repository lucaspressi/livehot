import React from 'react';

const sampleVideos = [
  { id: 1, title: 'Demo 1', src: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  { id: 2, title: 'Demo 2', src: 'https://www.w3schools.com/html/movie.mp4' },
];

function VideoFeed({ onSelect }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {sampleVideos.map((video) => (
        <button
          key={video.id}
          onClick={() => onSelect(video)}
          className="bg-slate-700 rounded p-2 text-left"
        >
          <div className="aspect-video bg-black mb-2"></div>
          <div className="text-white">{video.title}</div>
        </button>
      ))}
    </div>
  );
}

export default VideoFeed;
