import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import API from '../../services/api';

function LoginModal({ isOpen, onClose, onLogin }) {
  const { register, handleSubmit, reset } = useForm();
  const [error, setError] = useState('');

  const onSubmit = async (data) => {
    try {
      const res = await API.post('/auth/login', data);
      const { token, user } = res.data.data;
      localStorage.setItem('token', token);
      if (onLogin) {
        onLogin(user);
      }
      reset();
      setError('');
      onClose();
    } catch (err) {
      console.error(err);
      setError('Falha ao fazer login');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded w-80 shadow-lg">
        <h2 className="text-lg font-bold mb-4">Entrar</h2>
        {error && <p className="text-red-600 mb-2 text-sm">{error}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 border rounded"
            {...register('email', { required: true })}
          />
          <input
            type="password"
            placeholder="Senha"
            className="w-full p-2 border rounded"
            {...register('password', { required: true })}
          />
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 rounded"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-pink-600 text-white rounded"
            >
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginModal;
