import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Home from './pages/Home';
import StreamPage from './pages/StreamPage';
import LoginModal from './components/auth/LoginModal';
import RegisterModal from './components/auth/RegisterModal';
import Toast from './components/common/Toast';

function App() {
  const { showLogin, showRegister, notifications } = useSelector(state => state.ui || {
    showLogin: false,
    showRegister: false,
    notifications: []
  });

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/broadcast/:id" element={<BroadcastPage />} />
        <Route path="/stream/:id" element={<StreamPage />} />
      </Routes>

      {showLogin && <LoginModal />}
      {showRegister && <RegisterModal />}

      {/* Notificações */}
      {notifications && notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map(notification => (
            <Toast key={notification.id} {...notification} />
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
