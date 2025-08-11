
'use client';

import { useState } from 'react';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
}

export default function Header({ isDarkMode, onToggleDarkMode, onLogout }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-emerald-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <i className="ri-graduation-cap-line text-xl sm:text-2xl mr-2 sm:mr-3"></i>
              <h1 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold leading-tight">
                <span className="block sm:hidden text-xs">Admission Application Management</span>
                <span className="hidden sm:block">Admission Application Management</span>
              </h1>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={onToggleDarkMode}
                className="flex items-center px-3 py-2 text-emerald-100 hover:text-white transition-colors rounded-lg hover:bg-emerald-800/50"
              >
                <i className={`${isDarkMode ? 'ri-sun-line' : 'ri-moon-line'} mr-2`}></i>
                <span className="text-sm">{isDarkMode ? 'Light' : 'Dark'}</span>
              </button>
              
              <button 
                onClick={onLogout}
                className="flex items-center px-3 py-2 text-emerald-100 hover:text-white transition-colors rounded-lg hover:bg-emerald-800/50"
              >
                <i className="ri-logout-box-line mr-2"></i>
                <span className="text-sm">Sign out</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 text-white rounded-lg hover:bg-emerald-800/50 transition-colors"
            >
              <i className={`${isMobileMenuOpen ? 'ri-close-line' : 'ri-menu-line'} text-lg sm:text-xl`}></i>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        </div>
      )}

      {/* Mobile Menu Panel */}
      <div className={`fixed top-14 sm:top-16 right-4 z-50 md:hidden transition-all duration-300 transform ${
        isMobileMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
      }`}>
        <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl shadow-2xl border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'} overflow-hidden min-w-[200px]`}>
          <div className="p-4 space-y-2">
            <button
              onClick={() => {
                onToggleDarkMode();
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                isDarkMode 
                  ? 'text-slate-300 hover:text-white hover:bg-slate-700' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <i className={`${isDarkMode ? 'ri-sun-line' : 'ri-moon-line'} mr-3 text-lg`}></i>
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            
            <div className={`h-px ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'} my-2`}></div>
            
            <button
              onClick={() => {
                onLogout();
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                isDarkMode 
                  ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20' 
                  : 'text-red-600 hover:text-red-700 hover:bg-red-50'
              }`}
            >
              <i className="ri-logout-box-line mr-3 text-lg"></i>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
