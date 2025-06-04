import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Home from './pages/Home';
import LoginModal from './components/auth/LoginModal';
import RegisterModal from './components/auth/RegisterModal';
import Toast from './components/common/Toast';

function App() {
  const { showLogin, showRegister } = useSelector(state => state.ui);
  const { notifications } = useSelector(state => state.ui);

  return (
    <div className="App">
      {/* Rotas principais */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stream/:id" element={<StreamPage />} />
      </Routes>

      {/* Modais globais */}
      {showLogin && <LoginModal />}
      {showRegister && <RegisterModal />}

      {/* Notificações */}
      {notifications.map(notification => (
        <Toast key={notification.id} {...notification} />
      ))}
    </div>
  );
}

export default App;