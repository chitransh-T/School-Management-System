'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaCalendarAlt, FaEdit, FaSave } from 'react-icons/fa';
import axios from 'axios';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    // Form validation
    if (!sessionName) {
      setFormError('Session name is required');
      return;
    }
  
    if (!startDate) {
      setFormError('Start date is required');
      return;
    }
  
    if (!endDate) {
      setFormError('End date is required');
      return;
    }
  
    try {
      setFormSubmitting(true);
      setFormError('');
  
      // Get token from localStorage
      const token = localStorage.getItem('token');
  
      if (!token) {
        setFormError('Authentication token not found');
        setFormSubmitting(false);
        return;
      }
  
      const sessionData = {
        session_name: sessionName,
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
      alert('Session created successfully');
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create session');
      }
  
      const result = await response.json();
      console.log('Session created successfully:', result);
  
      // Set success message or trigger UI feedback
      setFormSuccess(true);
  
      // Reset the form
      setSessionName('');
      setStartDate('');
      setEndDate('');
  
      // Optionally redirect after success
      router.push('/managesession'); // Uncomment and adjust path if needed
  
    } catch (err: any) {
      console.error('Error creating session:', err);
      setFormError(err.message || 'Failed to create session. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };
  
  return (
    <DashboardLayout>
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-xl mx-auto bg-white shadow-lg rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-6 text-blue-700">Create Session</h2>

        <div className="space-y-5">
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
              />
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-blue-700 font-medium mb-1">Start Date (YYYY-MM-DD)*</label>
            <div className="flex items-center border rounded-lg px-3 py-2 border-blue-300 focus-within:border-blue-700">
              <FaCalendarAlt className="text-blue-600 mr-2" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full focus:outline-none"
              />
            </div>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-blue-700 font-medium mb-1">End Date (YYYY-MM-DD)*</label>
            <div className="flex items-center border rounded-lg px-3 py-2 border-blue-300 focus-within:border-blue-700">
              <FaCalendarAlt className="text-blue-600 mr-2" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full focus:outline-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              onClick={handleSubmit}
              disabled={formSubmitting}
              className="w-full bg-blue-700 text-white font-semibold py-3 rounded-lg hover:bg-blue-800 transition duration-200 flex justify-center items-center"
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
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
};

export default CreateSessionPage;
