import { useState, useEffect } from 'react';
import API from '../services/api';

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      API.defaults.headers.common.Authorization = `Bearer ${token}`;
      API.get('/auth/me')
        .then(res => setUser(res.data.data))
        .catch(() => setUser(null));
    } else {
      delete API.defaults.headers.common.Authorization;
      setUser(null);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    setToken(res.data.data.token);
    setUser(res.data.data.user);
    localStorage.setItem('token', res.data.data.token);
  };

  const register = async (payload) => {
    const res = await API.post('/auth/register', payload);
    setToken(res.data.data.token);
    setUser(res.data.data.user);
    localStorage.setItem('token', res.data.data.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return { user, token, login, register, logout };
}
