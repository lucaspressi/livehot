import React, { useState } from 'react';

function GiftButton() {
  const [animating, setAnimating] = useState(false);

  const handleClick = () => {
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);
  };

  return (
    <button
      className={`px-4 py-2 bg-pink-600 text-white rounded ${animating ? 'gift-pop' : ''}`}
      onClick={handleClick}
    >
      Enviar Presente
    </button>
  );
}

export default GiftButton;
