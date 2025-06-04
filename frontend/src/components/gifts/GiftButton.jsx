import React, { useState } from 'react';
import GiftModal from './GiftModal';
import useGifts from '../../hooks/useGifts';

function GiftButton({ recipientId }) {
  const [open, setOpen] = useState(false);
  const { sendGift } = useGifts();

  const handleSelect = async (gift) => {
    await sendGift({ giftId: gift.id, recipientId });
    setOpen(false);
  };

  return (
    <>
      <button
        className="px-4 py-2 bg-pink-600 text-white rounded"
        onClick={() => setOpen(true)}
      >
        Enviar Presente
      </button>
      <GiftModal isOpen={open} onClose={() => setOpen(false)} onSelect={handleSelect} />
    </>
  );
}

export default GiftButton;
