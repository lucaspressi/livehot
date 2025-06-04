import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';

function ProfilePage({ user: propUser, onUpdateProfile }) {
  const { user: authUser } = useAuth();
  const user = propUser || authUser;
  const [form, setForm] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
  });

  if (!user) {
    return <p className="p-4">Usuário não autenticado</p>;
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onUpdateProfile) {
      onUpdateProfile(form);
    }
  };

  return (
    <div className="p-4 max-w-sm mx-auto">
      <h2 className="text-lg font-bold mb-4">Perfil</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          name="displayName"
          className="w-full border p-2 rounded"
          value={form.displayName}
          onChange={handleChange}
          placeholder="Nome de exibição"
        />
        <input
          type="email"
          name="email"
          className="w-full border p-2 rounded"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
        />
        <button type="submit" className="px-4 py-2 bg-pink-600 text-white rounded">
          Salvar
        </button>
      </form>
    </div>
  );
}

export default ProfilePage;
