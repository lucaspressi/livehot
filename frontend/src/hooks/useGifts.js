import { useState, useCallback } from 'react';
import API from '../services/api';

export default function useGifts() {
  const [gifts, setGifts] = useState([]);

  const fetchGifts = useCallback(async () => {
    const res = await API.get('/gifts');
    setGifts(res.data.data.gifts);
    return res.data.data.gifts;
  }, []);

  const sendGift = useCallback(async ({ giftId, recipientId, amount = 1 }) => {
    const res = await API.post('/gifts/send', { giftId, recipientId, amount });
    return res.data.data;
  }, []);

  return { gifts, fetchGifts, sendGift };
}
