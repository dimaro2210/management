
'use client';

import { useState } from 'react';
import { supabase, safeDbOperation, type Admission } from '../lib/supabase';

interface AdmissionFormProps {
  isDarkMode: boolean;
}

export default function AdmissionForm({ isDarkMode }: AdmissionFormProps) {
  const [formData, setFormData] = useState({
    studentName: '',
    programOfInterest: '',
    emailAddress: '',
    homeAddress: '',
    schoolName: '',
    consultantName: '',
    admissionStatus: 'Pending',
    visaStatus: 'Documentation in progress'
  });

  const [showAdmissionDropdown, setShowAdmissionDropdown] = useState(false);
  const [showVisaDropdown, setShowVisaDropdown] = useState(false);
  const [admissionStatuses] = useState(['Pending', 'Under Review', 'Accepted', 'Rejected', 'Waitlisted']);
  const [visaStatuses] = useState(['Documentation in progress', 'Application submitted', 'Interview scheduled', 'Approved', 'Rejected', 'Not applicable']);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form validation
  const validateForm = (): string | null => {
    const requiredFields = [
      { field: 'studentName' as keyof typeof formData, label: 'Student Name' },
      { field: 'programOfInterest' as keyof typeof formData, label: 'Program of Interest' },
      { field: 'emailAddress' as keyof typeof formData, label: 'Email Address' },
      { field: 'homeAddress' as keyof typeof formData, label: 'Home Address' },
      { field: 'schoolName' as keyof typeof formData, label: 'School Name' },
      { field: 'consultantName' as keyof typeof formData, label: 'Consultant Name' }
    ];

    for (const { field, label } of requiredFields) {
      if (!formData[field].trim()) {
        return `${label} is required`;
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.emailAddress.trim())) {
      return 'Please enter a valid email address';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Clear previous messages
    setSuccessMessage('');
    setErrorMessage('');
    
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      // Use safe database operation wrapper with proper typing
      const result = await safeDbOperation<Admission[]>(async () => {
        return await supabase
          .from('admissions')
          .insert([
            {
              student_name: formData.studentName.trim(),
              program_of_interest: formData.programOfInterest.trim(),
              email_address: formData.emailAddress.trim().toLowerCase(),
              home_address: formData.homeAddress.trim(),
              school_name: formData.schoolName.trim(),
              consultant_name: formData.consultantName.trim(),
              admission_status: formData.admissionStatus,
              visa_status: formData.visaStatus
            }
          ])
          .select()
      });

      if (!result.success || result.error) {
        throw result.error || new Error('Failed to save application');
      }

      setSuccessMessage(`✅ Application saved successfully! 

📋 Application Details:
• Student: ${formData.studentName}
• Program: ${formData.programOfInterest}
• Status: ${formData.admissionStatus}
• Consultant: ${formData.consultantName}

The application has been added to the system and can be viewed in the Admission Management section.`);
      
      // Reset form after successful submission
      setFormData({
        studentName: '',
        programOfInterest: '',
        emailAddress: '',
        homeAddress: '',
        schoolName: '',
        consultantName: '',
        admissionStatus: 'Pending',
        visaStatus: 'Documentation in progress'
      });

      // Close dropdowns
      setShowAdmissionDropdown(false);
      setShowVisaDropdown(false);

    } catch (error) {
      console.error('Error saving application:', error);
      
      let errorMsg = 'Failed to save application. ';
      
      if (error instanceof Error) {
        if (error.message.includes('duplicate key')) {
          errorMsg += 'An application with this email already exists.';
        } else if (error.message.includes('network')) {
          errorMsg += 'Network error. Please check your internet connection.';
        } else if (error.message.includes('permission')) {
          errorMsg += 'Permission denied. Please contact administrator.';
        } else {
          errorMsg += error.message;
        }
      } else {
        errorMsg += 'Please try again.';
      }
      
      setErrorMessage(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      studentName: '',
      programOfInterest: '',
      emailAddress: '',
      homeAddress: '',
      schoolName: '',
      consultantName: '',
      admissionStatus: 'Pending',
      visaStatus: 'Documentation in progress'
    });
    setSuccessMessage('');
    setErrorMessage('');
    setShowAdmissionDropdown(false);
    setShowVisaDropdown(false);
  };

  // Handle input changes with validation
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error message when user starts typing
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  // Close dropdowns when clicking outside
  const handleDocumentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.dropdown-container')) {
      setShowAdmissionDropdown(false);
      setShowVisaDropdown(false);
    }
  };

  return (
    <div 
      className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-xl p-4 sm:p-6 md:p-8 transition-colors duration-300`}
      onClick={handleDocumentClick}
    >
      <div className="flex items-center mb-6">
        <i className="ri-user-add-line text-2xl text-emerald-500 mr-3"></i>
        <h2 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>New Student Application</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'} mb-2`}>
              Student Name *
            </label>
            <input
              type="text"
              required
              value={formData.studentName}
              onChange={(e) => handleInputChange('studentName', e.target.value)}
              className={`w-full px-4 py-3 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors duration-300`}
              placeholder="Enter student's full name"
              maxLength={100}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'} mb-2`}>
              Program of Interest *
            </label>
            <input
              type="text"
              required
              value={formData.programOfInterest}
              onChange={(e) => handleInputChange('programOfInterest', e.target.value)}
              className={`w-full px-4 py-3 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors duration-300`}
              placeholder="e.g., Computer Science, Business Administration"
              maxLength={150}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'} mb-2`}>
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.emailAddress}
              onChange={(e) => handleInputChange('emailAddress', e.target.value)}
              className={`w-full px-4 py-3 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors duration-300`}
              placeholder="student@example.com"
              maxLength={150}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'} mb-2`}>
              Home Address *
            </label>
            <input
              type="text"
              required
              value={formData.homeAddress}
              onChange={(e) => handleInputChange('homeAddress', e.target.value)}
              className={`w-full px-4 py-3 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors duration-300`}
              placeholder="Full residential address"
              maxLength={200}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'} mb-2`}>
              School Name *
            </label>
            <input
              type="text"
              required
              value={formData.schoolName}
              onChange={(e) => handleInputChange('schoolName', e.target.value)}
              className={`w-full px-4 py-3 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors duration-300`}
              placeholder="Current or previous school"
              maxLength={150}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'} mb-2`}>
              Consultant Name *
            </label>
            <input
              type="text"
              required
              value={formData.consultantName}
              onChange={(e) => handleInputChange('consultantName', e.target.value)}
              className={`w-full px-4 py-3 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors duration-300`}
              placeholder="Assigned consultant"
              maxLength={100}
            />
          </div>

          <div className="dropdown-container">
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'} mb-2`}>
              Admission Status *
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAdmissionDropdown(!showAdmissionDropdown);
                  setShowVisaDropdown(false);
                }}
                className={`w-full px-4 py-3 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left flex items-center justify-between transition-colors duration-300`}
              >
                <span>{formData.admissionStatus || 'Select admission status'}</span>
                <i className={`ri-arrow-down-s-line transition-transform ${showAdmissionDropdown ? 'rotate-180' : ''}`}></i>
              </button>

              {showAdmissionDropdown && (
                <div className={`absolute z-20 w-full mt-1 ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'} border rounded-lg shadow-lg max-h-60 overflow-y-auto transition-colors duration-300`}>
                  {admissionStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInputChange('admissionStatus', status);
                        setShowAdmissionDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left ${isDarkMode ? 'hover:bg-slate-600 text-white' : 'hover:bg-gray-100 text-gray-900'} transition-colors`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="dropdown-container">
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'} mb-2`}>
              Visa Application Status *
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowVisaDropdown(!showVisaDropdown);
                  setShowAdmissionDropdown(false);
                }}
                className={`w-full px-4 py-3 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left flex items-center justify-between transition-colors duration-300`}
              >
                <span>{formData.visaStatus || 'Select visa status'}</span>
                <i className={`ri-arrow-down-s-line transition-transform ${showVisaDropdown ? 'rotate-180' : ''}`}></i>
              </button>

              {showVisaDropdown && (
                <div className={`absolute z-20 w-full mt-1 ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'} border rounded-lg shadow-lg max-h-60 overflow-y-auto transition-colors duration-300`}>
                  {visaStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInputChange('visaStatus', status);
                        setShowVisaDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left ${isDarkMode ? 'hover:bg-slate-600 text-white' : 'hover:bg-gray-100 text-gray-900'} transition-colors`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {successMessage && (
          <div className="flex items-start p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg">
            <i className="ri-checkbox-circle-line text-xl mr-3 mt-0.5 flex-shrink-0"></i>
            <div className="text-sm whitespace-pre-line">{successMessage}</div>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-start p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <i className="ri-error-warning-line text-xl mr-3 mt-0.5 flex-shrink-0"></i>
            <div className="text-sm">{errorMessage}</div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 !rounded-button flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                Saving Application...
              </>
            ) : (
              <>
                <i className="ri-save-line mr-2"></i>
                Save Application
              </>
            )}
          </button>

          <button
            type="button"
            onClick={resetForm}
            disabled={isSubmitting}
            className={`flex-1 sm:flex-none ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} font-semibold py-3 px-6 rounded-lg transition-all duration-200 !rounded-button flex items-center justify-center disabled:opacity-50`}
          >
            <i className="ri-refresh-line mr-2"></i>
            Clear Form
          </button>
        </div>
      </form>
    </div>
  );
}
