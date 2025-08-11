'use client';

import { useEffect, useState } from 'react';

interface PreloaderProps {
  onComplete: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 200);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-800 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Logo Animation */}
        <div className="relative mb-8">
          <div className="w-24 h-24 mx-auto mb-6 animate-pulse">
            <img 
              src="https://static.readdy.ai/image/28c8b0a0bba8991acd08e641db719671/a174ece109cdb0253a8eb0fc08e17f91.png"
              alt="Logo"
              className="w-full h-full object-contain filter drop-shadow-2xl"
            />
          </div>
          
          {/* Rotating ring around logo */}
          <div className="absolute inset-0 w-32 h-32 mx-auto -top-4">
            <div className="w-full h-full border-2 border-transparent border-t-emerald-400 rounded-full animate-spin"></div>
          </div>
        </div>

        {/* Loading text */}
        <h2 className="text-white text-xl font-semibold mb-6 animate-fade-in">
          Admission Application Management
        </h2>

        {/* Progress bar */}
        <div className="w-64 h-1 bg-slate-700 rounded-full mx-auto mb-4 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <p className="text-slate-300 text-sm">Loading system...</p>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </div>
  );
}