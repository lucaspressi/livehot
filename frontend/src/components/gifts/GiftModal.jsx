import React, { useEffect } from 'react';
import useGifts from '../../hooks/useGifts';
import Modal from '../common/Modal';

function GiftModal({ isOpen, onClose, onSelect }) {
  const { gifts, fetchGifts } = useGifts();

  useEffect(() => {
    if (isOpen) {
      fetchGifts();
    }
  }, [isOpen, fetchGifts]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-lg font-bold mb-4">Presentes</h2>
      <div className="grid grid-cols-2 gap-4">
        {gifts.map((gift) => (
          <button
            key={gift.id}
            className="p-2 border rounded hover:bg-gray-100"
            onClick={() => onSelect && onSelect(gift)}
          >
            {gift.image && (
              <img
                src={gift.image}
                alt={gift.name}
                className="w-12 h-12 mx-auto"
              />
            )}
            <p className="text-sm text-center mt-1">{gift.name}</p>
          </button>
        ))}
      </div>
    </Modal>
  );
}

export default GiftModal;
