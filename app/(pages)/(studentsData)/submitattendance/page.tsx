'use client'
import { useState } from 'react';
import Sidebar from '@/app/dashboardComponents/sidebar';

export default function MarkStudentAttendance() {
  const [date, setDate] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Date:', date);
    console.log('Class:', selectedClass);
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="p-6 max-w-4xl mx-auto my-12">
        <h1 className="text-2xl font-semibold mb-8 text-center">Update Attendance</h1>
        
        <div className="mb-8">
          <div className="flex gap-4 justify-between mb-8">
            <input
              type="text"
              placeholder="Roll No"
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Name"
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
           
            <input
              type="text"
              placeholder="Section"
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="leave">Leave</option>
            </select>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}