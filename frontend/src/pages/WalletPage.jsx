import React, { useEffect } from 'react';
import useWallet from '../hooks/useWallet';

function WalletPage() {
  const { balance, transactions, fetchWallet, purchase } = useWallet();

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const buy = (pkg) => {
    purchase(pkg);
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <h1 className="text-xl font-bold">Carteira</h1>
      <p>Saldo: <span className="font-semibold">{balance ?? 0}</span> moedas</p>

      <div className="space-x-2">
        <button className="px-4 py-2 bg-pink-600 text-white rounded" onClick={() => buy('basic')}>Básico</button>
        <button className="px-4 py-2 bg-pink-600 text-white rounded" onClick={() => buy('premium')}>Premium</button>
        <button className="px-4 py-2 bg-pink-600 text-white rounded" onClick={() => buy('vip')}>VIP</button>
      </div>

      <h2 className="text-lg font-semibold">Transações</h2>
      <ul className="space-y-2">
        {transactions.map(tx => (
          <li key={tx.id} className="p-2 border rounded">
            <p className="text-sm">{tx.type} - {tx.amount} moedas</p>
            <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default WalletPage;
