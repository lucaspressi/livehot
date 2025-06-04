import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Home from './pages/Home';
import WalletPage from './pages/WalletPage';
import BroadcastPage from './pages/BroadcastPage';
import LoginModal from './components/auth/LoginModal';
import RegisterModal from './components/auth/RegisterModal';
import Toast from './components/common/Toast';

function App() {
  const { showLogin, showRegister, notifications } = useSelector(state => state.ui);

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/broadcast/:id" element={<BroadcastPage />} />
      </Routes>

      {showLogin && <LoginModal />}
      {showRegister && <RegisterModal />}

      {notifications.map(n => (
        <Toast key={n.id} {...n} />
      ))}
    </div>
  );
}

export default App;
