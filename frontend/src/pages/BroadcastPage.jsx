import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../services/api';

function BroadcastPage() {
  const { id } = useParams();
  const [info, setInfo] = useState(null);

  useEffect(() => {
    const start = async () => {
      const res = await API.post(`/broadcast/${id}`);
      setInfo(res.data.data);
    };
    start();
  }, [id]);

  if (!info) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  return (
    <div className="p-4 space-y-2">
      <h1 className="text-xl font-bold">Broadcast</h1>
      <p><strong>Sala:</strong> {info.room}</p>
      <p><strong>URL:</strong> {info.url}</p>
      <p><strong>Token:</strong> <code className="break-all">{info.token}</code></p>
      <p className="text-sm text-gray-500">Use essas informações no cliente LiveKit para iniciar sua transmissão.</p>
    </div>
  );
}

export default BroadcastPage;
