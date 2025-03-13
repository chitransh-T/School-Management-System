'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/app/dashboardComponents/sidebar';
import { format } from 'date-fns';
import { useAuth } from '@/app/context/AuthContext';

interface Student {
  id: number;
  student_name: string;
  registration_number: string;
  assigned_class: string;
  assigned_section: string;
}

const MarkAttendance = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<{ [key: number]: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const classes = Array.from({ length: 12 }, (_, i) => `class ${i + 1}`);
  const sections = ['a', 'b', 'c'];

  // Fetch students based on selected class and section
  const fetchStudents = async () => {
    if (!selectedClass || !selectedSection) return;

    setFetchingStudents(true);
    setError('');
    
    console.log('Fetching students with params:', { selectedClass, selectedSection });
    
    try {
      const url = `http://localhost:1000/students?class=${encodeURIComponent(selectedClass)}&section=${encodeURIComponent(selectedSection)}`;
      console.log('Request URL:', url);
      
      const response = await fetch(url);
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch students');
      }

      if (Array.isArray(data) && data.length === 0) {
        setError('No students found for the selected class and section');
        setStudents([]);
      } else if (Array.isArray(data)) {
        setStudents(data);
        // Initialize attendance for all students as "Present" (true)
        const initialAttendance: { [key: number]: boolean } = {};
        data.forEach((student: Student) => {
          initialAttendance[student.id] = true;
        });
        setAttendance(initialAttendance);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err instanceof Error ? err.message : 'Failed to load students');
      setStudents([]);
    } finally {
      setFetchingStudents(false);
    }
  };

  useEffect(() => {
    if (selectedClass && selectedSection) {
      console.log('Class or section changed:', { selectedClass, selectedSection });
      fetchStudents();
    }
  }, [selectedClass, selectedSection]);

  // Handle attendance checkbox change
  const handleAttendanceChange = (studentId: number, isPresent: boolean) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: isPresent,
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
      const attendanceData = students.map((student) => ({
        date: selectedDate,
        class: selectedClass,
        section: selectedSection,
        student_id: student.id,
        is_present: attendance[student.id] ? 1 : 0,
        marked_by: user.id,
      }));

      const url = 'http://localhost:1000/attendance';
      console.log('Request URL:', url);
      console.log('Request data:', attendanceData);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ attendanceData }),
      });
      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit attendance');
      }

      setSuccess('Attendance marked successfully');

      // Clear form after successful submission
      setTimeout(() => {
        setSelectedClass('');
        setSelectedSection('');
        setStudents([]);
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
    <div className="flex flex-col md:flex-row">
      <Sidebar />
      <div className="flex-1 p-6 max-w-6xl mx-auto my-12">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-700">Mark Attendance</h1>

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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full p-2 border rounded-md text-gray-700"
                  required
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls.replace('class', 'Class')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section
                </label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full p-2 border rounded-md text-gray-700"
                  required
                >
                  <option value="">Select Section</option>
                  {sections.map((section) => (
                    <option key={section} value={section}>
                      {section.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {fetchingStudents ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : students.length > 0 ? (
              <div className="mt-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Roll No
                        </th>
                        <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {students.map((student) => (
                        <tr key={student.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                            {student.registration_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                            {student.student_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                            <input
                              type="checkbox"
                              checked={attendance[student.id]}
                              onChange={(e) =>
                                handleAttendanceChange(student.id, e.target.checked)
                              }
                              className="w-4 h-4 text-blue-600 border rounded focus:ring-blue-500"
                            />
                            <span className="ml-2">
                              {attendance[student.id] ? 'Present' : 'Absent'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : selectedClass && selectedSection ? (
              <div className="text-center py-8 text-gray-500">
                No students found for selected class and section
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
    </div>
  );
};

export default MarkAttendance;