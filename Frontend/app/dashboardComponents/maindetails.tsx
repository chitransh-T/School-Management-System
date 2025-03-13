'use client';
import React, { useState, useEffect } from 'react';
import ResponsiveContainer from '../components/ResponsiveContainer';
import ResponsiveText from '../components/ResponsiveText';
import { useAuth } from '../context/AuthContext';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  notices: Array<{
    id: number;
    message: string;
    postedOn: string;
  }>;
}

const Stats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    notices: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:1000/dashboard/${user.id}`);
        const data = await response.json();
        
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  return (
    <div className="w-full">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
              <h2 className="text-base sm:text-lg font-semibold text-gray-700">Total Students</h2>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
              <h2 className="text-base sm:text-lg font-semibold text-gray-700">Total Teachers</h2>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalTeachers}</p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 sm:col-span-2 md:col-span-1">
              <h2 className="text-base sm:text-lg font-semibold text-gray-700">Total Classes</h2>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalClasses}</p>
            </div>
          </div>

          {/* Notices Section */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">Notices</h2>
            {stats.notices && stats.notices.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {stats.notices.map((notice, index) => (
                  <div key={notice.id || index} className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm sm:text-base text-gray-800">{notice.message}</p>
                    <p className="text-xs sm:text-sm text-gray-500">Posted on {notice.postedOn}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-sm sm:text-base text-gray-800">No notices available.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Stats;