'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/app/dashboardComponents/sidebar';
import { format } from 'date-fns';
import { useAuth } from '@/app/context/AuthContext';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';

interface Teacher {
  id: number;
  teacher_name: string;
}

const MarkAttendance = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [attendance, setAttendance] = useState<{ [key: number]: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [fetchingTeachers, setFetchingTeachers] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch teachers when component mounts or date changes
  useEffect(() => {
    fetchTeachers();
  }, [selectedDate]);

  // Fetch teachers 
  const fetchTeachers = async () => {

    setFetchingTeachers(true);
    setError('');
    
    console.log('Fetching teachers with params:');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const url = `${baseUrl}/api/teachers`;
      console.log('Request URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch teachers');
      }

      if (Array.isArray(data) && data.length === 0) {
        setError('No teachers found for the selected class and section');
        setTeachers([]);
      } else if (Array.isArray(data)) {
        setTeachers(data);
        // Initialize attendance for all students as "Present" (true)
        const initialAttendance: { [key: number]: boolean } = {};
        data.forEach((teacher: Teacher) => {
          initialAttendance[teacher.id] = true;
        });
        setAttendance(initialAttendance);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err instanceof Error ? err.message : 'Failed to load students');
      setTeachers([]);
    } finally {
      setFetchingTeachers(false);
    }
  };

  // Handle attendance checkbox change
  const handleAttendanceChange = (teacherId: number, isPresent: boolean) => {
    setAttendance((prev) => ({
      ...prev,
      [teacherId]: isPresent,
    }));
  };

  // Submit attendance to the backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!user?.id) {
      setError('Authentication failed. Please try again.');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Format data according to the backend API expectations
      const teachersData = teachers.map((teacher) => ({
        teacher_id: teacher.id,
        is_present: attendance[teacher.id] ? 1 : 0
      }));

      const url = `${baseUrl}/api/attendance`;
      console.log('Request URL:', url);
      console.log('Request data:', { date: selectedDate, teachers: teachersData });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          date: selectedDate, 
          teachers: teachersData 
        }),
      });
      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to submit attendance');
      }

      setSuccess('Attendance marked successfully');

      // Clear form after successful submission
      setTimeout(() => {
        setTeachers([]);
        setAttendance({});
        setSuccess('');
      }, 2000);
    } catch (err) {
      console.error('Error submitting attendance:', err);
      setError('Failed to submit attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex-1 p-6 max-w-6xl mx-auto my-12">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-700">Mark Teacher Attendance</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-2 border rounded-md text-gray-700"
                  required
                />
              </div>

            
            </div>

            {fetchingTeachers ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : teachers.length > 0 ? (
              <div className="mt-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {teachers.map((teacher) => (
                        <tr key={teacher.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                            {teacher.teacher_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                            <input
                              type="checkbox"
                              checked={attendance[teacher.id]}
                              onChange={(e) =>
                                handleAttendanceChange(teacher.id, e.target.checked)
                              }
                              className="w-4 h-4 text-blue-600 border rounded focus:ring-blue-500"
                            />
                            <span className="ml-2">
                              {attendance[teacher.id] ? 'Present' : 'Absent'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : selectedDate ? (
              <div className="text-center py-8 text-gray-500">
                No teachers found 
              </div>
            ) : null}

            <div className="mt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Attendance'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MarkAttendance;