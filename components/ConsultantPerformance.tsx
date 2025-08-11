
'use client';

import { useState, useEffect } from 'react';
import { supabase, safeDbOperation, type Admission } from '../lib/supabase';

interface ConsultantStats {
  name: string;
  students: number;
  accepted: number;
  pending: number;
  rejected: number;
  underReview: number;
  waitlisted: number;
  successRate: number;
}

interface ConsultantPerformanceProps {
  isDarkMode: boolean;
}

export default function ConsultantPerformance({ isDarkMode }: ConsultantPerformanceProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [consultantData, setConsultantData] = useState<ConsultantStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchConsultantPerformance();
  }, [selectedMonth]);

  const fetchConsultantPerformance = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Create date range for the selected month
      const year = parseInt(selectedMonth.split('-')[0]);
      const month = parseInt(selectedMonth.split('-')[1]);
      
      const startOfMonth = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endOfMonth = new Date(year, month, 0).toISOString().split('T')[0];

      const result = await safeDbOperation<Admission[]>(async () => {
        return await supabase
          .from('admissions')
          .select('*')
          .gte('created_at', startOfMonth)
          .lte('created_at', endOfMonth + 'T23:59:59.999Z')
          .order('created_at', { ascending: false });
      });

      if (!result.success || result.error) {
        throw result.error || new Error('Failed to fetch consultant performance data');
      }

      const consultantMap: { [key: string]: ConsultantStats } = {};

      (result.data || []).forEach((admission: Admission) => {
        const consultant = admission.consultant_name?.trim() || 'Unknown Consultant';
        
        if (!consultantMap[consultant]) {
          consultantMap[consultant] = {
            name: consultant,
            students: 0,
            accepted: 0,
            pending: 0,
            rejected: 0,
            underReview: 0,
            waitlisted: 0,
            successRate: 0
          };
        }

        consultantMap[consultant].students++;

        const status = admission.admission_status?.toLowerCase() || 'pending';
        switch (status) {
          case 'accepted':
            consultantMap[consultant].accepted++;
            break;
          case 'pending':
            consultantMap[consultant].pending++;
            break;
          case 'rejected':
            consultantMap[consultant].rejected++;
            break;
          case 'under review':
            consultantMap[consultant].underReview++;
            break;
          case 'waitlisted':
            consultantMap[consultant].waitlisted++;
            break;
          default:
            consultantMap[consultant].pending++;
        }
      });

      // Calculate success rates
      const consultantList = Object.values(consultantMap).map(consultant => ({
        ...consultant,
        successRate: consultant.students > 0 
          ? Math.round((consultant.accepted / consultant.students) * 100)
          : 0
      }));

      setConsultantData(consultantList);
    } catch (error) {
      console.error('Error fetching consultant performance:', error);
      setError(error instanceof Error ? error.message : 'Failed to load consultant performance data');
    } finally {
      setLoading(false);
    }
  };

  const totalStudents = consultantData.reduce((sum, consultant) => sum + consultant.students, 0);
  const totalAccepted = consultantData.reduce((sum, consultant) => sum + consultant.accepted, 0);
  const totalPending = consultantData.reduce((sum, consultant) => sum + consultant.pending, 0);
  const totalRejected = consultantData.reduce((sum, consultant) => sum + consultant.rejected, 0);
  const overallSuccessRate = totalStudents > 0 ? Math.round((totalAccepted / totalStudents) * 100) : 0;

  // Get month name for display
  const getMonthName = (monthValue: string) => {
    try {
      const [year, month] = monthValue.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });
    } catch {
      return monthValue;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <i className="ri-loader-4-line animate-spin text-2xl text-emerald-500"></i>
        <span className={`ml-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Loading consultant performance...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-xl p-6 transition-colors duration-300`}>
        <div className="flex items-center text-red-600 mb-4">
          <i className="ri-error-warning-line text-2xl mr-3"></i>
          <h3 className="text-lg font-semibold">Error Loading Data</h3>
        </div>
        <p className={`${isDarkMode ? 'text-slate-300' : 'text-gray-600'} mb-4`}>{error}</p>
        <button
          onClick={fetchConsultantPerformance}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors !rounded-button"
        >
          <i className="ri-refresh-line mr-2"></i>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Month selector */}
      <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-xl p-4 sm:p-6 transition-colors duration-300`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className={`text-lg sm:text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Consultant Performance
            </h2>
            <p className={`${isDarkMode ? 'text-slate-400' : 'text-gray-600'} text-sm mt-1`}>
              Track consultant success rates and application metrics
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <label className={`${isDarkMode ? 'text-slate-300' : 'text-gray-700'} text-sm font-medium`}>
              Select Month:
            </label>
            <div className="relative">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                max={new Date().toISOString().slice(0, 7)}
                className={`px-3 sm:px-4 py-2 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base transition-colors duration-300`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6">
        <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-xl p-4 sm:p-6 transition-colors duration-300`}>
          <div className="flex items-center">
            <div className="p-2 sm:p-3 bg-emerald-600 rounded-full">
              <i className="ri-group-line text-white text-lg sm:text-xl"></i>
            </div>
            <div className="ml-3 sm:ml-4">
              <p className={`text-lg sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{totalStudents}</p>
              <p className={`${isDarkMode ? 'text-slate-400' : 'text-gray-600'} text-xs sm:text-sm`}>Total Students</p>
            </div>
          </div>
        </div>

        <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-xl p-4 sm:p-6 transition-colors duration-300`}>
          <div className="flex items-center">
            <div className="p-2 sm:p-3 bg-green-600 rounded-full">
              <i className="ri-checkbox-circle-line text-white text-lg sm:text-xl"></i>
            </div>
            <div className="ml-3 sm:ml-4">
              <p className={`text-lg sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{totalAccepted}</p>
              <p className={`${isDarkMode ? 'text-slate-400' : 'text-gray-600'} text-xs sm:text-sm`}>Accepted</p>
            </div>
          </div>
        </div>

        <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-xl p-4 sm:p-6 transition-colors duration-300`}>
          <div className="flex items-center">
            <div className="p-2 sm:p-3 bg-yellow-600 rounded-full">
              <i className="ri-time-line text-white text-lg sm:text-xl"></i>
            </div>
            <div className="ml-3 sm:ml-4">
              <p className={`text-lg sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{totalPending}</p>
              <p className={`${isDarkMode ? 'text-slate-400' : 'text-gray-600'} text-xs sm:text-sm`}>Pending</p>
            </div>
          </div>
        </div>

        <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-xl p-4 sm:p-6 transition-colors duration-300`}>
          <div className="flex items-center">
            <div className="p-2 sm:p-3 bg-red-600 rounded-full">
              <i className="ri-close-circle-line text-white text-lg sm:text-xl"></i>
            </div>
            <div className="ml-3 sm:ml-4">
              <p className={`text-lg sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{totalRejected}</p>
              <p className={`${isDarkMode ? 'text-slate-400' : 'text-gray-600'} text-xs sm:text-sm`}>Rejected</p>
            </div>
          </div>
        </div>

        <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-xl p-4 sm:p-6 transition-colors duration-300`}>
          <div className="flex items-center">
            <div className="p-2 sm:p-3 bg-purple-600 rounded-full">
              <i className="ri-percent-line text-white text-lg sm:text-xl"></i>
            </div>
            <div className="ml-3 sm:ml-4">
              <p className={`text-lg sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{overallSuccessRate}%</p>
              <p className={`${isDarkMode ? 'text-slate-400' : 'text-gray-600'} text-xs sm:text-sm`}>Success Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Consultant Performance Table */}
      <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-xl overflow-hidden transition-colors duration-300`}>
        <div className={`p-4 sm:p-6 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <h3 className={`text-base sm:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Consultant Rankings
          </h3>
          <p className={`${isDarkMode ? 'text-slate-400' : 'text-gray-600'} mt-1 text-sm`}>
            Performance for {getMonthName(selectedMonth)}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className={`${isDarkMode ? 'bg-slate-700' : 'bg-gray-50'} transition-colors duration-300`}>
              <tr>
                <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-500'} uppercase tracking-wider`}>Rank</th>
                <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-500'} uppercase tracking-wider`}>Consultant</th>
                <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-500'} uppercase tracking-wider`}>Students</th>
                <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-500'} uppercase tracking-wider hidden sm:table-cell`}>Accepted</th>
                <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-500'} uppercase tracking-wider hidden md:table-cell`}>Pending</th>
                <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-500'} uppercase tracking-wider hidden md:table-cell`}>Rejected</th>
                <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-500'} uppercase tracking-wider`}>Success Rate</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-gray-200'} transition-colors duration-300`}>
              {consultantData
                .sort((a, b) => {
                  // Sort by success rate first, then by number of students
                  if (b.successRate !== a.successRate) {
                    return b.successRate - a.successRate;
                  }
                  return b.students - a.students;
                })
                .map((consultant, index) => (
                  <tr key={consultant.name} className={`${isDarkMode ? 'hover:bg-slate-750' : 'hover:bg-gray-50'} transition-colors duration-200`}>
                    <td className="px-3 sm:px-6 py-4">
                      <div className="flex items-center">
                        {index === 0 && consultant.students > 0 && <i className="ri-trophy-line text-yellow-500 text-base sm:text-lg mr-1 sm:mr-2"></i>}
                        {index === 1 && consultant.students > 0 && <i className="ri-medal-line text-gray-400 text-base sm:text-lg mr-1 sm:mr-2"></i>}
                        {index === 2 && consultant.students > 0 && <i className="ri-award-line text-orange-500 text-base sm:text-lg mr-1 sm:mr-2"></i>}
                        <span className={`${isDarkMode ? 'text-white' : 'text-gray-900'} font-medium text-sm sm:text-base`}>#{index + 1}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate max-w-[120px] sm:max-w-none`} title={consultant.name}>
                        {consultant.name}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <span className="text-base sm:text-lg font-semibold text-emerald-400">{consultant.students}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 hidden sm:table-cell">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                        {consultant.accepted}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 hidden md:table-cell">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {consultant.pending}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 hidden md:table-cell">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        {consultant.rejected}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <div className="flex items-center">
                        <span className={`${isDarkMode ? 'text-white' : 'text-gray-900'} font-medium text-sm mr-2`}>
                          {consultant.successRate}%
                        </span>
                        <div className={`w-12 sm:w-16 ${isDarkMode ? 'bg-slate-600' : 'bg-gray-300'} rounded-full h-2 transition-colors duration-300`}>
                          <div
                            className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(consultant.successRate, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {consultantData.length === 0 && (
          <div className="p-6 sm:p-8 text-center">
            <i className={`ri-inbox-line text-3xl sm:text-4xl ${isDarkMode ? 'text-slate-400' : 'text-gray-400'} mb-2`}></i>
            <p className={`${isDarkMode ? 'text-slate-400' : 'text-gray-600'} text-sm sm:text-base mb-2`}>
              No applications found for {getMonthName(selectedMonth)}
            </p>
            <p className={`${isDarkMode ? 'text-slate-500' : 'text-gray-500'} text-xs`}>
              Try selecting a different month or add some applications first
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
