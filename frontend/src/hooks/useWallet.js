import { useState, useCallback } from 'react';
import API from '../services/api';

export default function useWallet() {
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const fetchWallet = useCallback(async () => {
    const res = await API.get('/wallet');
    setBalance(res.data.data.balance);
    setTransactions(res.data.data.transactions || []);
    return res.data.data;
  }, []);

  const purchase = useCallback(async (pkg) => {
    const res = await API.post('/wallet/purchase', { package: pkg });
    await fetchWallet();
    return res.data.data;
  }, [fetchWallet]);

  const fetchTransactions = useCallback(async (page = 1, limit = 20) => {
    const res = await API.get('/wallet/transactions', { params: { page, limit } });
    setTransactions(res.data.data);
    return res.data.data;
  }, []);

  return { balance, transactions, fetchWallet, purchase, fetchTransactions };
}
