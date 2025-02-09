import React from 'react';

const Stats = () => {
  return (
    <div className="flex-1 p-4 my-14">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700">Total Students</h2>
          <p className="text-2xl font-bold text-gray-900">1,200</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700">Total Teachers</h2>
          <p className="text-2xl font-bold text-gray-900">50</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700">Total Classes</h2>
          <p className="text-2xl font-bold text-gray-900">30</p>
        </div>
      </div>

      {/* Notices Section */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Notices</h2>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-800">Notice 1: School will be closed on Monday.</p>
            <p className="text-sm text-gray-500">Posted on 2023-10-01</p>
          </div>
         
        </div>
      </div>
    </div>
  );
};

export default Stats;