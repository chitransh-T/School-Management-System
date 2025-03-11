'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/app/dashboardComponents/sidebar';
import { format } from 'date-fns';

interface Student {
  id: number;
  student_name: string;
  registration_number: string;
  assigned_class: string;
  assigned_section: string;
}

const MarkAttendance = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchStudents = async () => {
    if (!selectedClass || !selectedSection) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `http://localhost:1000/students?class=${selectedClass}&section=${selectedSection}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      setStudents(data);
      
      // Initialize attendance for all students as 'Present'
      const initialAttendance: { [key: number]: string } = {};
      data.forEach((student: Student) => {
        initialAttendance[student.id] = 'Present';
      });
      setAttendance(initialAttendance);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedClass, selectedSection]);

  const handleAttendanceChange = (studentId: number, status: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const attendanceData = students.map((student) => ({
        student_id: student.id,
        date: selectedDate,
        status: attendance[student.id],
      }));

      const response = await fetch('http://localhost:1000/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attendanceData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit attendance');
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
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((cls) => (
                    <option key={cls} value={cls.toString()}>
                      {cls}
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
                  {['A', 'B', 'C'].map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {students.length > 0 && (
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
                          <td className="px-6 py-4 whitespace-nowrap">
                            {student.registration_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {student.student_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={attendance[student.id]}
                              onChange={(e) =>
                                handleAttendanceChange(student.id, e.target.value)
                              }
                              className="w-full p-2 border rounded-md"
                            >
                              <option value="Present">Present</option>
                              <option value="Absent">Absent</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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
