
'use client';

import { useState } from 'react';
import Header from './Header';
import AdmissionForm from './AdmissionForm';
import AdmissionManagement from './AdmissionManagement';
import ConsultantPerformance from './ConsultantPerformance';

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('new-admission');
  const [isDarkMode, setIsDarkMode] = useState(true);

  const handleToggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <Header 
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onLogout={onLogout}
      />
      
      <div className="pt-16">
        <nav className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border-b transition-colors duration-300`}>
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex space-x-2 sm:space-x-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab('new-admission')}
                className={`flex items-center px-3 sm:px-4 py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'new-admission'
                    ? `${isDarkMode ? 'text-emerald-400 border-emerald-400' : 'text-emerald-600 border-emerald-600'}`
                    : `${isDarkMode ? 'text-slate-400 border-transparent hover:text-slate-300' : 'text-gray-500 border-transparent hover:text-gray-700'}`
                }`}
              >
                <i className="ri-add-line mr-1 sm:mr-2"></i>
                <span className="hidden sm:inline">New Admission</span>
                <span className="sm:hidden">New</span>
              </button>
              
              <button
                onClick={() => setActiveTab('management')}
                className={`flex items-center px-3 sm:px-4 py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'management'
                    ? `${isDarkMode ? 'text-emerald-400 border-emerald-400' : 'text-emerald-600 border-emerald-600'}`
                    : `${isDarkMode ? 'text-slate-400 border-transparent hover:text-slate-300' : 'text-gray-500 border-transparent hover:text-gray-700'}`
                }`}
              >
                <i className="ri-file-list-line mr-1 sm:mr-2"></i>
                <span className="hidden sm:inline">Admission Management</span>
                <span className="sm:hidden">Management</span>
              </button>
              
              <button
                onClick={() => setActiveTab('consultant-performance')}
                className={`flex items-center px-3 sm:px-4 py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'consultant-performance'
                    ? `${isDarkMode ? 'text-emerald-400 border-emerald-400' : 'text-emerald-600 border-emerald-600'}`
                    : `${isDarkMode ? 'text-slate-400 border-transparent hover:text-slate-300' : 'text-gray-500 border-transparent hover:text-gray-700'}`
                }`}
              >
                <i className="ri-bar-chart-line mr-1 sm:mr-2"></i>
                <span className="hidden sm:inline">Consultant Performance</span>
                <span className="sm:hidden">Performance</span>
              </button>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
          {activeTab === 'new-admission' && <AdmissionForm isDarkMode={isDarkMode} />}
          {activeTab === 'management' && <AdmissionManagement isDarkMode={isDarkMode} />}
          {activeTab === 'consultant-performance' && <ConsultantPerformance isDarkMode={isDarkMode} />}
        </main>
      </div>
    </div>
  );
}
