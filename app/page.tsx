'use client';

import { useState } from 'react';
import LoginForm from '../components/LoginForm';
import Dashboard from '../components/Dashboard';
import Preloader from '../components/Preloader';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showPreloader, setShowPreloader] = useState(true);

  const handlePreloaderComplete = () => {
    setShowPreloader(false);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  if (showPreloader) {
    return <Preloader onComplete={handlePreloaderComplete} />;
  }

  return (
    <div className="min-h-screen">
      {!isLoggedIn ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <Dashboard onLogout={handleLogout} />
      )}
    </div>
  );
}