import React from 'react';

function VideoOverlay({ title }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
      {title}
    </div>
  );
}

export default VideoOverlay;
