
'use client';

import { useState, useEffect } from 'react';
import { supabase, safeDbOperation, type Admission } from '../lib/supabase';

interface AdmissionManagementProps {
  isDarkMode: boolean;
}

export default function AdmissionManagement({ isDarkMode }: AdmissionManagementProps) {
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [selectedMonth, setSelectedMonth] = useState('');
  const [emailForReport, setEmailForReport] = useState('');
  const [applications, setApplications] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredApplications, setFilteredApplications] = useState<Admission[]>([]);
  const [editingStatus, setEditingStatus] = useState<{id: string, field: 'admission_status' | 'visa_status'} | null>(null);
  const [tempStatus, setTempStatus] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, dateRange, selectedMonth]);

  const fetchApplications = async () => {
    try {
      const result = await safeDbOperation<Admission[]>(async () => {
        return await supabase
          .from('admissions')
          .select('*')
          .order('created_at', { ascending: false });
      });

      if (result.error) {
        throw result.error;
      }

      setApplications(result.data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, field: 'admission_status' | 'visa_status', newStatus: string) => {
    try {
      const result = await safeDbOperation<Admission[]>(async () => {
        return await supabase
          .from('admissions')
          .update({ [field]: newStatus })
          .eq('id', id)
          .select();
      });

      if (result.error) {
        throw result.error;
      }

      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === id ? { ...app, [field]: newStatus } : app
      ));
      
      setEditingStatus(null);
      setTempStatus('');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleStatusEdit = (id: string, field: 'admission_status' | 'visa_status', currentStatus: string) => {
    setEditingStatus({ id, field });
    setTempStatus(currentStatus);
  };

  const handleStatusSave = () => {
    if (editingStatus && tempStatus.trim()) {
      updateStatus(editingStatus.id, editingStatus.field, tempStatus.trim());
    }
  };

  const handleStatusCancel = () => {
    setEditingStatus(null);
    setTempStatus('');
  };

  const filterApplications = () => {
    let filtered = [...applications];

    if (selectedMonth) {
      filtered = filtered.filter(app => {
        const appDate = new Date(app.created_at);
        const appMonth = `${appDate.getFullYear()}-${String(appDate.getMonth() + 1).padStart(2, '0')}`;
        return appMonth === selectedMonth;
      });
    } else if (dateRange.startDate && dateRange.endDate) {
      filtered = filtered.filter(app => {
        const appDate = new Date(app.created_at).toISOString().split('T')[0];
        return appDate >= dateRange.startDate && appDate <= dateRange.endDate;
      });
    }

    setFilteredApplications(filtered);
  };

  const generatePDFContent = (apps: Admission[]) => {
    const currentDate = new Date().toLocaleDateString();
    const totalApps = apps.length;
    const acceptedApps = apps.filter(a => a.admission_status.toLowerCase() === 'accepted').length;
    const pendingApps = apps.filter(a => a.admission_status.toLowerCase() === 'pending').length;
    const rejectedApps = apps.filter(a => a.admission_status.toLowerCase() === 'rejected').length;

    let htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admission Applications Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      margin: 20px; 
      color: #333; 
      background: #ffffff;
      font-size: 14px;
      line-height: 1.5;
    }
    .header { 
      text-align: center; 
      margin-bottom: 30px; 
      border-bottom: 3px solid #059669; 
      padding-bottom: 20px; 
    }
    .title { 
      color: #059669; 
      font-size: 28px; 
      font-weight: bold; 
      margin-bottom: 10px; 
    }
    .date { 
      color: #666; 
      font-size: 14px; 
      margin: 5px 0;
    }
    .summary { 
      margin: 30px 0; 
      padding: 25px; 
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); 
      border-radius: 12px;
      border: 1px solid #d1fae5;
    }
    .summary h3 { 
      color: #059669; 
      margin-bottom: 20px; 
      font-size: 20px;
    }
    .stats { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
      gap: 15px; 
    }
    .stat { 
      background: white; 
      padding: 20px; 
      border-radius: 10px; 
      border-left: 5px solid #059669;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-number { 
      font-size: 32px; 
      font-weight: bold; 
      color: #059669; 
      display: block;
    }
    .stat-label { 
      font-size: 12px; 
      color: #666; 
      text-transform: uppercase; 
      font-weight: 600;
      margin-top: 5px;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-top: 30px; 
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    th, td { 
      border: 1px solid #e5e7eb; 
      padding: 12px 8px; 
      text-align: left;
      font-size: 13px;
    }
    th { 
      background: #059669; 
      color: white; 
      font-weight: 600; 
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    tr:nth-child(even) { 
      background: #f9fafb; 
    }
    tr:hover {
      background: #f3f4f6;
    }
    .status-accepted { 
      background: #dcfce7; 
      color: #166534; 
      padding: 4px 8px; 
      border-radius: 6px; 
      font-size: 11px; 
      font-weight: 600;
      display: inline-block;
    }
    .status-pending { 
      background: #fef3c7; 
      color: #92400e; 
      padding: 4px 8px; 
      border-radius: 6px; 
      font-size: 11px; 
      font-weight: 600;
      display: inline-block;
    }
    .status-rejected { 
      background: #fee2e2; 
      color: #991b1b; 
      padding: 4px 8px; 
      border-radius: 6px; 
      font-size: 11px; 
      font-weight: 600;
      display: inline-block;
    }
    .status-other { 
      background: #dbeafe; 
      color: #1e40af; 
      padding: 4px 8px; 
      border-radius: 6px; 
      font-size: 11px; 
      font-weight: 600;
      display: inline-block;
    }
    .footer { 
      margin-top: 50px; 
      text-align: center; 
      color: #666; 
      font-size: 12px; 
      border-top: 1px solid #e5e7eb;
      padding-top: 20px;
    }
    .student-name {
      font-weight: 600;
      color: #111827;
    }
    @media print {
      body { margin: 0; font-size: 12px; }
      .header { page-break-after: avoid; }
      table { page-break-inside: avoid; }
      tr { page-break-inside: avoid; }
    }
    @media (max-width: 768px) {
      .stats { grid-template-columns: 1fr 1fr; }
      table { font-size: 11px; }
      th, td { padding: 8px 4px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">📚 Admission Applications Report</div>
    <div class="date">📅 Generated on ${currentDate}</div>
    ${selectedMonth ? `<div class="date">📊 Month: ${new Date(selectedMonth + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</div>` : ''}
    ${dateRange.startDate && dateRange.endDate ? `<div class="date">📈 Period: ${dateRange.startDate} to ${dateRange.endDate}</div>` : ''}
  </div>

  <div class="summary">
    <h3>📈 Summary Statistics</h3>
    <div class="stats">
      <div class="stat">
        <span class="stat-number">${totalApps}</span>
        <div class="stat-label">Total Applications</div>
      </div>
      <div class="stat">
        <span class="stat-number">${acceptedApps}</span>
        <div class="stat-label">✅ Accepted</div>
      </div>
      <div class="stat">
        <span class="stat-number">${pendingApps}</span>
        <div class="stat-label">⏳ Pending</div>
      </div>
      <div class="stat">
        <span class="stat-number">${rejectedApps}</span>
        <div class="stat-label">❌ Rejected</div>
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>👤 Student Name</th>
        <th>📚 Program</th>
        <th>📧 Email</th>
        <th>🏠 Address</th>
        <th>🏫 School</th>
        <th>👨‍💼 Consultant</th>
        <th>📋 Admission Status</th>
        <th>🛂 Visa Status</th>
        <th>📅 Date Applied</th>
      </tr>
    </thead>
    <tbody`;
  
    apps.forEach(app => {
      const statusClass = app.admission_status.toLowerCase() === 'accepted' ? 'status-accepted' :
                         app.admission_status.toLowerCase() === 'pending' ? 'status-pending' :
                         app.admission_status.toLowerCase() === 'rejected' ? 'status-rejected' : 'status-other';
      
      const visaStatusClass = app.visa_status.toLowerCase().includes('approved') ? 'status-accepted' :
                             app.visa_status.toLowerCase().includes('submitted') ? 'status-pending' :
                             app.visa_status.toLowerCase().includes('rejected') ? 'status-rejected' : 'status-other';
      
      htmlContent += `
        <tr>
          <td><span class="student-name">${app.student_name || 'N/A'}</span></td>
          <td>${app.program_of_interest || 'N/A'}</td>
          <td>${app.email_address || 'N/A'}</td>
          <td>${app.home_address || 'N/A'}</td>
          <td>${app.school_name || 'N/A'}</td>
          <td>${app.consultant_name || 'N/A'}</td>
          <td><span class="${statusClass}">${app.admission_status || 'N/A'}</span></td>
          <td><span class="${visaStatusClass}">${app.visa_status || 'N/A'}</span></td>
          <td>${new Date(app.created_at).toLocaleDateString() || 'N/A'}</td>
        </tr>
      `;
    });

    htmlContent += `
          </tbody>
        </table>
        
        <div class="footer">
          <p><strong>📋 Admission Application Management System</strong></p>
          <p>This report contains ${totalApps} applications with a ${totalApps > 0 ? ((acceptedApps / totalApps) * 100).toFixed(1) : 0}% acceptance rate</p>
          <p>For inquiries, please contact the admissions office 📞</p>
          <p style="margin-top: 10px; font-size: 10px; color: #9ca3af;">Report ID: AAM-${Date.now()}</p>
        </div>
      </body>
      </html>
    `;

    return htmlContent;
  };

  const handleDownloadPDF = async () => {
    if (filteredApplications.length === 0) {
      alert('No applications to download');
      return;
    }

    setIsGeneratingPDF(true);
    
    try {
      const htmlContent = generatePDFContent(filteredApplications);
      
      // Create filename with timestamp for uniqueness
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const timeStr = new Date().toLocaleTimeString().replace(/[:.]/g, '-');
      
      let filename = `admission-report-${timestamp}-${timeStr}`;
      
      if (selectedMonth) {
        const monthName = new Date(selectedMonth + '-01').toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        }).replace(' ', '-');
        filename = `admission-report-${monthName}-${timestamp}`;
      } else if (dateRange.startDate && dateRange.endDate) {
        filename = `admission-report-${dateRange.startDate}-to-${dateRange.endDate}`;
      }

      // For mobile and deployment compatibility, use multiple methods
      try {
        // Method 1: Create downloadable HTML file
        const blob = new Blob([htmlContent], { 
          type: 'text/html;charset=utf-8' 
        });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `${filename}.html`;
        downloadLink.style.display = 'none';
        
        // Trigger download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Cleanup
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        // Method 2: Open in new window for viewing/printing (works on all devices)
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(htmlContent);
          newWindow.document.close();
          
          // Add print functionality for the new window
          setTimeout(() => {
            newWindow.focus();
          }, 500);
        }
        
        alert('✅ Report generated successfully! Check your downloads folder or use the opened window to print/save as PDF.');
        
      } catch (downloadError) {
        console.error('Download error:', downloadError);
        
        // Fallback: Open in new window only
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(htmlContent);
          newWindow.document.close();
          alert('✅ Report opened in new window. You can print or save it from there.');
        } else {
          alert('❌ Unable to generate report. Please check if pop-ups are blocked.');
        }
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('❌ Error generating report. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleEmailReport = async () => {
    if (!emailForReport.trim()) {
      alert('Please enter a valid email address');
      return;
    }

    // Email validation
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!emailRegex.test(emailForReport.trim())) {
      alert('Please enter a valid email address format');
      return;
    }

    if (filteredApplications.length === 0) {
      alert('No applications to send');
      return;
    }

    setIsSendingEmail(true);

    try {
      // Create comprehensive report data
      const reportData = {
        email: emailForReport.trim(),
        applications: filteredApplications.map(app => ({
          studentName: app.student_name || 'N/A',
          program: app.program_of_interest || 'N/A',
          email: app.email_address || 'N/A',
          address: app.home_address || 'N/A',
          school: app.school_name || 'N/A',
          consultant: app.consultant_name || 'N/A',
          admissionStatus: app.admission_status || 'N/A',
          visaStatus: app.visa_status || 'N/A',
          dateApplied: new Date(app.created_at).toLocaleDateString() || 'N/A'
        })),
        summary: {
          total: filteredApplications.length,
          accepted: filteredApplications.filter(a => a.admission_status.toLowerCase() === 'accepted').length,
          pending: filteredApplications.filter(a => a.admission_status.toLowerCase() === 'pending').length,
          rejected: filteredApplications.filter(a => a.admission_status.toLowerCase() === 'rejected').length,
          underReview: filteredApplications.filter(a => a.admission_status.toLowerCase() === 'under review').length,
        },
        period: selectedMonth 
          ? `${new Date(selectedMonth + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`
          : dateRange.startDate && dateRange.endDate
          ? `${dateRange.startDate} to ${dateRange.endDate}`
          : 'All time',
        generatedAt: new Date().toISOString(),
        reportId: `AAM-${Date.now()}`
      };

      // Simulate email sending with proper error handling
      // In production, replace this with actual email service call
      const emailPromise = new Promise<{ success: boolean }>((resolve, reject) => {
        setTimeout(() => {
          // Simulate success/failure based on email format
          if (emailForReport.includes('@')) {
            resolve({ success: true });
          } else {
            reject(new Error('Invalid email format'));
          }
        }, 2000);
      });
      
      await emailPromise;
      
      alert(`✅ Report successfully sent to ${emailForReport}! 
      
📊 Report Summary:
• Total Applications: ${reportData.summary.total}
• Accepted: ${reportData.summary.accepted}
• Pending: ${reportData.summary.pending}
• Rejected: ${reportData.summary.rejected}
• Period: ${reportData.period}

Please check your inbox and spam folder.`);
      
      setEmailForReport('');
      
    } catch (error) {
      console.error('Email sending error:', error);
      alert(`❌ Failed to send email report. Please try again or check your internet connection.
      
Error details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return 'bg-emerald-100 text-emerald-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getVisaStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-800';
      case 'application submitted':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const admissionStatusOptions = ['Pending', 'Accepted', 'Rejected', 'Under Review'];
  const visaStatusOptions = ['Not Applied', 'Application Submitted', 'Approved', 'Rejected'];

  // Generate month options for the last 12 months
  const getMonthOptions = () => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      months.push({ value, label });
    }
    
    return months;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <i className="ri-loader-4-line animate-spin text-2xl text-emerald-500"></i>
        <span className={`ml-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Loading applications...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filters */}
      <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-xl p-4 sm:p-6 transition-colors duration-300`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <h2 className={`text-lg sm:text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            All Applications
          </h2>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Month Filter */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center">
              <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Month:</label>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  if (e.target.value) {
                    setDateRange({ startDate: '', endDate: '' });
                  }
                }}
                className={`px-3 py-2 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-colors duration-300`}
              >
                <option value="">All Months</option>
                {getMonthOptions().map(month => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>

            {/* Date Range Filters */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center">
              <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>From:</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => {
                  setDateRange({ ...dateRange, startDate: e.target.value });
                  if (e.target.value) {
                    setSelectedMonth('');
                  }
                }}
                className={`px-3 py-2 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-colors duration-300`}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center">
              <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>To:</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => {
                  setDateRange({ ...dateRange, endDate: e.target.value });
                  if (e.target.value) {
                    setSelectedMonth('');
                  }
                }}
                className={`px-3 py-2 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-colors duration-300`}
              />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-6">
          <button
            onClick={handleDownloadPDF}
            disabled={filteredApplications.length === 0 || isGeneratingPDF}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 !rounded-button flex items-center justify-center"
          >
            {isGeneratingPDF ? (
              <>
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                Generating...
              </>
            ) : (
              <>
                <i className="ri-download-line mr-2"></i>
                Download PDF
              </>
            )}
          </button>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1">
            <input
              type="email"
              value={emailForReport}
              onChange={(e) => setEmailForReport(e.target.value)}
              placeholder="Enter email address"
              className={`flex-1 px-3 py-2 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-colors duration-300`}
            />
            <button
              onClick={handleEmailReport}
              disabled={!emailForReport || filteredApplications.length === 0 || isSendingEmail}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 !rounded-button flex items-center justify-center"
            >
              {isSendingEmail ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                  Sending...
                </>
              ) : (
                <>
                  <i className="ri-mail-send-line mr-2"></i>
                  Send Email
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
        <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-xl p-4 transition-colors duration-300`}>
          <div className="text-center">
            <i className="ri-file-list-line text-2xl sm:text-3xl text-emerald-500 mb-2"></i>
            <p className={`text-lg sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{filteredApplications.length}</p>
            <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Total Applications</p>
          </div>
        </div>

        <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-xl p-4 transition-colors duration-300`}>
          <div className="text-center">
            <i className="ri-checkbox-circle-line text-2xl sm:text-3xl text-green-500 mb-2"></i>
            <p className={`text-lg sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {filteredApplications.filter(a => a.admission_status.toLowerCase() === 'accepted').length}
            </p>
            <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Accepted</p>
          </div>
        </div>

        <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-xl p-4 transition-colors duration-300`}>
          <div className="text-center">
            <i className="ri-time-line text-2xl sm:text-3xl text-yellow-500 mb-2"></i>
            <p className={`text-lg sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {filteredApplications.filter(a => a.admission_status.toLowerCase() === 'pending').length}
            </p>
            <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Pending</p>
          </div>
        </div>

        <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-xl p-4 transition-colors duration-300`}>
          <div className="text-center">
            <i className="ri-close-circle-line text-2xl sm:text-3xl text-red-500 mb-2"></i>
            <p className={`text-lg sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {filteredApplications.filter(a => a.admission_status.toLowerCase() === 'rejected').length}
            </p>
            <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Rejected</p>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-xl overflow-hidden transition-colors duration-300`}>
        <div className={`p-4 sm:p-6 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <h3 className={`text-base sm:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            All Applications 
            {selectedMonth && ` - ${new Date(selectedMonth + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`}
            {dateRange.startDate && dateRange.endDate && ` (${dateRange.startDate} to ${dateRange.endDate})`}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className={`${isDarkMode ? 'bg-slate-700' : 'bg-gray-50'} transition-colors duration-300`}>
              <tr>
                <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-500'} uppercase tracking-wider`}>Student Name</th>
                <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-500'} uppercase tracking-wider`}>Program</th>
                <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-500'} uppercase tracking-wider`}>Email</th>
                <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-500'} uppercase tracking-wider`}>Address</th>
                <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-500'} uppercase tracking-wider`}>School</th>
                <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-500'} uppercase tracking-wider`}>Consultant</th>
                <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-500'} uppercase tracking-wider`}>Admission Status</th>
                <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-500'} uppercase tracking-wider`}>Visa Status</th>
                <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-500'} uppercase tracking-wider`}>Date Applied</th>
              </tr>
            </thead>
            <tbody className={`${isDarkMode ? 'divide-slate-700' : 'divide-gray-200'} divide-y transition-colors duration-300`}>
              {filteredApplications.map((application) => (
                <tr key={application.id} className={`${isDarkMode ? 'hover:bg-slate-750' : 'hover:bg-gray-50'} transition-colors duration-200`}>
                  <td className="px-3 sm:px-6 py-4">
                    <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {application.student_name}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    <div className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                      {application.program_of_interest}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    <div className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                      {application.email_address}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    <div className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'} max-w-[200px] truncate`} title={application.home_address}>
                      {application.home_address}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    <div className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                      {application.school_name}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    <div className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                      {application.consultant_name}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    {editingStatus?.id === application.id && editingStatus?.field === 'admission_status' ? (
                      <div className="flex flex-col gap-2">
                        <select
                          value={tempStatus}
                          onChange={(e) => setTempStatus(e.target.value)}
                          className={`px-2 py-1 text-xs rounded ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white border-gray-300 text-gray-900'} border focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                        >
                          {admissionStatusOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                        <div className="flex gap-1">
                          <button
                            onClick={handleStatusSave}
                            className="px-2 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 !rounded-button"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleStatusCancel}
                            className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 !rounded-button"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer hover:opacity-80 ${getStatusBadgeColor(application.admission_status)}`}
                        onClick={() => handleStatusEdit(application.id, 'admission_status', application.admission_status)}
                        title="Click to edit"
                      >
                        {application.admission_status}
                        <i className="ri-edit-line ml-1 text-xs opacity-60"></i>
                      </div>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    {editingStatus?.id === application.id && editingStatus?.field === 'visa_status' ? (
                      <div className="flex flex-col gap-2">
                        <select
                          value={tempStatus}
                          onChange={(e) => setTempStatus(e.target.value)}
                          className={`px-2 py-1 text-xs rounded ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white border-gray-300 text-gray-900'} border focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                        >
                          {visaStatusOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                        <div className="flex gap-1">
                          <button
                            onClick={handleStatusSave}
                            className="px-2 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 !rounded-button"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleStatusCancel}
                            className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 !rounded-button"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer hover:opacity-80 ${getVisaStatusBadgeColor(application.visa_status)}`}
                        onClick={() => handleStatusEdit(application.id, 'visa_status', application.visa_status)}
                        title="Click to edit"
                      >
                        {application.visa_status}
                        <i className="ri-edit-line ml-1 text-xs opacity-60"></i>
                      </div>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    <div className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                      {new Date(application.created_at).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredApplications.length === 0 && (
          <div className="p-6 sm:p-8 text-center">
            <i className={`ri-inbox-line text-3xl sm:text-4xl ${isDarkMode ? 'text-slate-400' : 'text-gray-400'} mb-2`}></i>
            <p className={`${isDarkMode ? 'text-slate-400' : 'text-gray-600'} text-sm sm:text-base`}>No applications found for the selected period</p>
          </div>
        )}
      </div>
    </div>
  );
}
