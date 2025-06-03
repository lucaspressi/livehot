import React, { useState } from 'react';

function AuthModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Autenticado: ${email}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-slate-800 p-4 rounded w-80 space-y-3">
        <h2 className="text-white text-lg text-center">Login</h2>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-2 py-1 rounded text-black"
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-2 py-1 rounded text-black"
          placeholder="Senha"
          required
        />
        <button type="submit" className="w-full bg-pink-500 rounded text-white py-1">
          Entrar
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-slate-600 rounded text-white py-1"
        >
          Cancelar
        </button>
      </form>
    </div>
  );
}

export default AuthModal;
