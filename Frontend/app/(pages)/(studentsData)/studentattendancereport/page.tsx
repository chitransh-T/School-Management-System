'use client'
import { useState } from 'react';
import Sidebar from '@/app/dashboardComponents/sidebar';

export default function StudentAttendanceReport() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 p-6 my-12">
        {/* Search Bar */}
        <div className="flex justify-end mb-6">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
          />
        </div>

        {/* Table Header */}
        <div className="bg-white rounded-lg shadow">
          <div className="grid grid-cols-6 gap-4 p-4 border-b font-semibold text-gray-700">
            <div>Date</div>
            <div>Day</div>
            <div>ID</div>
            <div>Name</div>
            <div>Class</div>
            <div>Status</div>
          </div>

          {/* Table Content */}
          <div className="p-4">
            {/* This is where you'll map through your attendance records */}
            <div className="grid grid-cols-6 gap-4 py-2 text-gray-400">
              <div>2024-02-20</div>
              <div>Tuesday</div>
              <div>001</div>
              <div>John Doe</div>
              <div>Class 10</div>
              <div>Present</div>
            </div>
            {/* Add more rows as needed */}
          </div>
        </div>
      </div>
    </div>
  );
}