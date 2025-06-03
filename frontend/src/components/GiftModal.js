import React from 'react';

function GiftModal({ onClose }) {
  const gifts = ['🎁', '💎', '🔥'];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-800 p-4 rounded text-center space-y-2">
        <h2 className="text-white text-lg">Enviar Presente</h2>
        <div className="flex gap-2 justify-center">
          {gifts.map((g) => (
            <button
              key={g}
              onClick={() => alert(`Enviado ${g}`)}
              className="text-2xl"
            >
              {g}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-2 px-3 py-1 bg-pink-500 rounded text-white"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}

export default GiftModal;
