"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';

interface Session {
  id: string;
  session_name: string;
  start_date: string;
  end_date: string;
}

const EditSessionPage: React.FC = () => {
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('id');
  
  // Session data state
  const [sessionData, setSessionData] = useState<Session>({
    id: '',
    session_name: '',
    start_date: '',
    end_date: ''
  });
  
  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [formSuccess, setFormSuccess] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  

useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        if (!sessionId) {
          setError('Session ID is required');
          setLoading(false);
          return;
        }
        
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token not found');
          setLoading(false);
          return;
        }
        
        // Fetch the specific session by ID
        const sessionResponse = await fetch(`${baseUrl}/api/getsession?id=${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!sessionResponse.ok) {
          throw new Error(`Failed to fetch session: ${sessionResponse.status}`);
        }
        
        const result = await sessionResponse.json();
        
        if (!result.success || !result.data) {
          throw new Error('Invalid session data format');
        }
        
        // Find the specific session in the response data
        const session = Array.isArray(result.data) 
          ? result.data.find((s: Session) => s.id.toString() === sessionId)
          : result.data;
        
        if (!session) {
          throw new Error('Session not found');
        }
        
        setSessionData({
          id: session.id.toString(),
          session_name: session.session_name,
          start_date: session.start_date.split('T')[0], // Format date if needed
          end_date: session.end_date.split('T')[0]     // Format date if needed
        });
        
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [sessionId]);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setSessionData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!sessionData.session_name) {
      setFormError('Please enter a session name');
      return;
    }
    
    if (!sessionData.start_date) {
      setFormError('Please select a start date');
      return;
    }
    
    if (!sessionData.end_date) {
      setFormError('Please select an end date');
      return;
    }
    
    // Check if end date is after start date
    if (new Date(sessionData.end_date) <= new Date(sessionData.start_date)) {
      setFormError('End date must be after start date');
      return;
    }
    
    try {
      setFormSubmitting(true);
      setFormError('');
      setFormSuccess(false);
      setSuccessMessage('');
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setFormError('Authentication token not found');
        setFormSubmitting(false);
        return;
      }
      
      // Prepare the update data
      const updateData = {
        session_name: sessionData.session_name,
        start_date: sessionData.start_date,
        end_date: sessionData.end_date,
        id: sessionId
      };
      
      console.log('Updating session data:', updateData);
      
      // Make the API call to update the session
      const response = await fetch(`${baseUrl}/api/updatesession`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update session: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Session updated successfully:', result);
      
      // Success
      setFormSuccess(true);
      setSuccessMessage('Session updated successfully!');
      
      // Redirect to manage sessions page after a short delay
      setTimeout(() => {
        router.push('/managesession');
      }, 2000);
      
    } catch (err: any) {
      console.error('Error updating session:', err);
      setFormError(err.message || 'Failed to update session. Please try again.');
      setFormSuccess(false);
    } finally {
      setFormSubmitting(false);
    }
  };
  
  // Handle cancel button
  const handleCancel = () => {
    router.push('/managesession');
  };
  
  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex-1 bg-gray-100 p-6 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Loading session data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (error) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex-1 bg-gray-100 p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
            <button 
              onClick={() => router.push('/managesession')} 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Back to Manage Sessions
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="min-h-screen flex-1 bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Session</h1>
          
          {formSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              <p>{successMessage}</p>
            </div>
          )}
          
          {formError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p>{formError}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Session Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Session Name</label>
                <input
                  type="text"
                  name="session_name"
                  value={sessionData.session_name}
                  onChange={handleInputChange}
                  placeholder="Enter session name"
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              {/* Start Date */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  value={sessionData.start_date}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              {/* End Date */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  name="end_date"
                  value={sessionData.end_date}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            
            {/* Form Actions */}
            <div className="mt-8 flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formSubmitting}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${formSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {formSubmitting ? 'Updating...' : 'Update Session'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EditSessionPage;