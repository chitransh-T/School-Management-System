"use client"
import React, { useState, useEffect } from 'react';
import { PlusCircle, Users, GraduationCap, Clock } from 'lucide-react';
import Sidebar from '@/app/dashboardComponents/sidebar';
import { useRouter } from 'next/navigation';

interface Teacher {
  id: string;
  name: string;
  email: string;
  subject: string;
  yearsOfExperience: number;
  classesPerWeek: number;
  department: string;
  status: 'active' | 'on leave';
}

interface TeacherStats {
  totalTeachers: number;
  activeTeachers: number;
  averageExperience: number;
  totalClassesPerWeek: number;
}

const TeacherDashboard = () => {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Mathematics',
      yearsOfExperience: 5,
      classesPerWeek: 15,
      department: 'Science',
      status: 'active'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      subject: 'English',
      yearsOfExperience: 8,
      classesPerWeek: 12,
      department: 'Languages',
      status: 'on leave'
    },
  ]);

  const [stats, setStats] = useState<TeacherStats>({
    totalTeachers: 2,
    activeTeachers: 1,
    averageExperience: 6.5,
    totalClassesPerWeek: 27
  });

  useEffect(() => {
    // Remove API calls
  }, []);

  const handleAddTeacher = () => {
    router.push('/addteacher');
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="p-6 space-y-6">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-12">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between pb-2">
              <h3 className="text-sm font-medium text-gray-800">Total Teachers</h3>
              <Users className="h-4 w-4 text-gray-700" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalTeachers}</div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between pb-2">
              <h3 className="text-sm font-medium text-gray-800">Active Teachers</h3>
              <GraduationCap className="h-4 w-4 text-gray-700" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.activeTeachers}</div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between pb-2">
              <h3 className="text-sm font-medium text-gray-800">Avg. Experience</h3>
              <Clock className="h-4 w-4 text-gray-700" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.averageExperience} years</div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between pb-2">
              <h3 className="text-sm font-medium text-gray-800">Weekly Classes</h3>
              <GraduationCap className="h-4 w-4 text-gray-700" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalClassesPerWeek}</div>
          </div>
        </div>

        {/* Teachers Table Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-700">Teachers List</h2>
            <button 
              onClick={handleAddTeacher}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              Add New Teacher
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classes/Week</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{teacher.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.subject}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.yearsOfExperience} years</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.classesPerWeek}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        teacher.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {teacher.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;