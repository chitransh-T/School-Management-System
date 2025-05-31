'use client';

import React, { useState } from 'react';
import Sidebar from '@/app/dashboardComponents/sidebar';
import { format } from 'date-fns';
import  DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
interface Teacher {
  id: number;
  teacher_name: string;
  status: string;
  date: string;
}

const AttendanceReport = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceData, setAttendanceData] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      console.log('Fetching attendance with params:', { selectedDate });
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const url = `${baseUrl}/api/attendance/${encodeURIComponent(selectedDate)}`;
      console.log('Request URL:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch attendance data');
      }

      const data = await response.json();
      console.log('Response data:', data);

      // The API returns an object with 'students' and 'teachers' arrays
      // We only need the students data for this report
      if (data && data.teachers) {
        if (Array.isArray(data.teachers) && data.teachers.length === 0) {
          setError('No attendance records found for the selected criteria');
          setAttendanceData([]);
        } else if (Array.isArray(data.teachers)) {
          // Format the data to match our component's expectations
          const formattedData = data.teachers.map((teacher: { id: any; teacher_name: any; is_present: any; }) => ({
            id: teacher.id || Math.random().toString(36).substr(2, 9), // Generate an ID if not present
            teacher_name: teacher.teacher_name,
            status: teacher.is_present ? 'Present' : 'Absent',
            date: selectedDate
          }));
          setAttendanceData(formattedData);
        } else {
          throw new Error('Invalid teacher data format from server');
        }
      } else {
        setError('No attendance data found');
        setAttendanceData([]);
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError(err instanceof Error ? err.message : 'Failed to load attendance data');
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex-1 p-6 max-w-6xl mx-auto my-12">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-700">Attendance Report</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mb-6">
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
            <div className="mt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Loading...' : 'View Report'}
              </button>
            </div>
          </form>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-2 text-gray-600">Loading attendance data...</p>
            </div>
          ) : attendanceData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-gray-50">
                    {/* <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roll No
                    </th> */}
                    <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attendanceData.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-gray-50">
                      {/* <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {student.registration_number}
                      </td> */}
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {teacher.teacher_name}
                      </td>
                     
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            teacher.status === 'Present'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {teacher.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {format(new Date(teacher.date), 'dd/MM/yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-4 p-8 bg-gray-50 rounded-lg">
              <p>No attendance data found for the selected criteria</p>
              <p className="text-sm mt-2">Try selecting a different date</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AttendanceReport;
