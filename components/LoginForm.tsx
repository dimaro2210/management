'use client';

import { useState } from 'react';

interface LoginFormProps {
  onLogin: () => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Gabstep2025') {
      onLogin();
    } else {
      setError('Invalid password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-800 px-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4">
            <img 
              src="https://static.readdy.ai/image/28c8b0a0bba8991acd08e641db719671/a174ece109cdb0253a8eb0fc08e17f91.png"
              alt="Logo"
              className="w-full h-full object-contain filter drop-shadow-lg"
            />
          </div>
          <h1 className="text-white text-xl sm:text-2xl font-bold mb-2 leading-tight">
            Admission Application Management
          </h1>
          <p className="text-slate-300 text-sm">Enter password to access the system</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-3">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm sm:text-base"
                  placeholder="Enter your password"
                  required
                />
                <i className="ri-lock-line absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
              </div>
            </div>
            
            {error && (
              <div className="flex items-center text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <i className="ri-error-warning-line mr-2"></i>
                {error}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] !rounded-button flex items-center justify-center text-sm sm:text-base"
            >
              <i className="ri-login-box-line mr-2"></i>
              Sign In
            </button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-slate-700/50 text-center">
            <p className="text-slate-400 text-xs">Secure Access Portal • 2025</p>
          </div>
        </div>
      </div>
    </div>
  );
}