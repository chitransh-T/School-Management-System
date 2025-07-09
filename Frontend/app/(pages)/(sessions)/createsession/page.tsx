'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaCalendarAlt, FaEdit, FaSave } from 'react-icons/fa';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';

const CreateSessionPage = () => {
  const [sessionName, setSessionName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const showCustomSnackBar = (message: string, type: 'success' | 'error' = 'error') => {
    if (type === 'success') {
      setFormSuccess(true);
      setFormError('');
    } else {
      setFormError(message);
      setFormSuccess(false);
    }
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setFormError('');
      setFormSuccess(false);
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    // Form validation - matching Flutter validation logic
    if (!startDate || !endDate) {
      showCustomSnackBar('Please select both start and end dates');
      return;
    }

    if (!sessionName.trim()) {
      showCustomSnackBar('Please enter a session name');
      return;
    }
  
    try {
      setFormSubmitting(true);
      setFormError('');
      setFormSuccess(false);
  
      // Get token from localStorage
      const token = localStorage.getItem('token');
  
      if (!token) {
        showCustomSnackBar('Authentication token not found');
        setFormSubmitting(false);
        return;
      }
  
      const sessionData = {
        session_name: sessionName.trim(),
        start_date: startDate,
        end_date: endDate,
      };
  
      console.log('Submitting session data:', sessionData);
  
      const response = await fetch(`${baseUrl}/api/create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      const result = await response.json();
      console.log('API Response:', result);
  
      if (response.ok && result.success === true) {
        showCustomSnackBar(
          result.message || 'Session created successfully',
          'success'
        );
        
        // Reset the form - matching Flutter behavior
        setSessionName('');
        setStartDate('');
        setEndDate('');
        
        // Optional: redirect after a delay to show success message
        setTimeout(() => {
          router.push('/managesession');
        }, 1500);
      } else if (response.status === 400 && result.activeSessionEndDate) {
        // Handle special case for active session error - matching Flutter logic
        showCustomSnackBar(result.message);
      } else {
        showCustomSnackBar(result.message || 'Failed to create session');
      }
  
    } catch (err: any) {
      console.error('Error creating session:', err);
      showCustomSnackBar(err.message || 'Failed to create session. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle start date change - reset end date if it's before start date
  const handleStartDateChange = (newStartDate: string) => {
    setStartDate(newStartDate);
    
    // Reset end date if it's before start date (matching Flutter logic)
    if (endDate && newStartDate && new Date(endDate) < new Date(newStartDate)) {
      setEndDate('');
    }
  };
  
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-xl mx-auto bg-white shadow-lg rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-6 text-blue-700">New Academic Session</h2>

          {/* Success Message */}
          {formSuccess && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              Session created successfully!
            </div>
          )}

          {/* Error Message */}
          {formError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Session Name */}
            <div>
              <label className="block text-blue-700 font-medium mb-1">Session Name*</label>
              <div className="flex items-center border rounded-lg px-3 py-2 border-blue-300 focus-within:border-blue-700">
                <FaEdit className="text-blue-600 mr-2" />
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="w-full focus:outline-none"
                  placeholder="Enter session name"
                  disabled={formSubmitting}
                />
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-blue-700 font-medium mb-1">Start Date*</label>
              <div className="flex items-center border rounded-lg px-3 py-2 border-blue-300 focus-within:border-blue-700">
                <FaCalendarAlt className="text-blue-600 mr-2" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full focus:outline-none"
                  disabled={formSubmitting}
                  min="2000-01-01"
                  max="2100-12-31"
                />
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-blue-700 font-medium mb-1">End Date*</label>
              <div className="flex items-center border rounded-lg px-3 py-2 border-blue-300 focus-within:border-blue-700">
                <FaCalendarAlt className="text-blue-600 mr-2" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full focus:outline-none"
                  disabled={formSubmitting}
                  min={startDate || "2000-01-01"}
                  max="2100-12-31"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={formSubmitting}
                className="w-full bg-blue-700 text-white font-semibold py-3 rounded-lg hover:bg-blue-800 transition duration-200 flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formSubmitting ? (
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                ) : (
                  <FaSave className="mr-2" />
                )}
                {formSubmitting ? 'Creating...' : 'Create Session'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateSessionPage;