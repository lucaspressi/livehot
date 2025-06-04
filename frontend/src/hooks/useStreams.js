import { useState, useCallback } from 'react';
import API from '../services/api';

export default function useStreams() {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStreams = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await API.get('/streams', { params });
      setStreams(res.data.data.streams);
      return res.data.data;
    } finally {
      setLoading(false);
    }
  }, []);

  const getStream = useCallback(async (id) => {
    const res = await API.get(`/streams/${id}`);
    return res.data.data;
  }, []);

  const createStream = useCallback(async (payload) => {
    const res = await API.post('/streams', payload);
    return res.data.data;
  }, []);

  const startStream = useCallback(async (id) => {
    const res = await API.post(`/streams/${id}/start`);
    return res.data.data;
  }, []);

  const stopStream = useCallback(async (id) => {
    const res = await API.post(`/streams/${id}/stop`);
    return res.data.data;
  }, []);

  return {
    streams,
    loading,
    fetchStreams,
    getStream,
    createStream,
    startStream,
    stopStream,
  };
}
