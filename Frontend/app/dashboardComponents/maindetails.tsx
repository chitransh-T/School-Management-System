import React from 'react';
import ResponsiveContainer from '../components/ResponsiveContainer';
import ResponsiveText from '../components/ResponsiveText';

const Stats = () => {
  return (
    <div className="w-full">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-700">Total Students</h2>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">1,200</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-700">Total Teachers</h2>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">50</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 sm:col-span-2 md:col-span-1">
          <h2 className="text-base sm:text-lg font-semibold text-gray-700">Total Classes</h2>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">30</p>
        </div>
      </div>

      {/* Notices Section */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">Notices</h2>
        <div className="space-y-3 sm:space-y-4">
          <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
            <p className="text-sm sm:text-base text-gray-800">Notice 1: School will be closed on Monday.</p>
            <p className="text-xs sm:text-sm text-gray-500">Posted on 2023-10-01</p>
          </div>
          
          <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
            <p className="text-sm sm:text-base text-gray-800">Notice 2: Parent-teacher meeting scheduled for next Friday.</p>
            <p className="text-xs sm:text-sm text-gray-500">Posted on 2023-09-28</p>
          </div>
          
          <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
            <p className="text-sm sm:text-base text-gray-800">Notice 3: Annual sports day will be held on November 15th.</p>
            <p className="text-xs sm:text-sm text-gray-500">Posted on 2023-09-25</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;