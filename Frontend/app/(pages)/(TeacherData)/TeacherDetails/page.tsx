
'use client';
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
import { useRouter } from 'next/navigation';
import { FaEdit, FaTrash, FaFilter } from 'react-icons/fa';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';

interface Teacher {
  id: number;
  teacher_name: string;
  phone: string;
  email: string;
  address: string;
  teacher_photo: string;
  qualification_certificate: string;
}

const TeacherDetails = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        let url = 'http://localhost:1000/api/teachers';
        const params = new URLSearchParams();

        if (params.toString()) url += `?${params.toString()}`;

        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found');

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || `HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const teachersArray = Array.isArray(data) ? data : data.data || [];
        setTeachers(teachersArray);

      
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load teacher data');
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  const filteredTeachers = teachers.filter(
    (t) =>
      t.teacher_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (teacherId: number) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return;

    try {
      setError('');
      setSuccess('');
      
      // Show loading state
      const deletingTeacher = teachers.find(t => t.id === teacherId);
      const teacherName = deletingTeacher?.teacher_name || 'this teacher';
      setSuccess(`Deleting ${teacherName}...`);
      
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');

      console.log(`Deleting teacher with ID: ${teacherId}`);
      
      const res = await fetch(`http://localhost:1000/api/teachers/${teacherId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      // Handle response
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || errorData.error || `Failed to delete teacher (${res.status})`);
      }
      
      // Parse response data
      const data = await res.json();
      console.log('Delete response:', data);
      
      // Update UI
      setSuccess('Teacher deleted successfully');
      setTeachers(prevTeachers => prevTeachers.filter(t => t.id !== teacherId));
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting teacher:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete teacher');
      setSuccess('');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="w-full flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Teacher Details</h1>
            <p className="text-gray-600 mt-1">Total Teachers: {filteredTeachers.length}</p>
          </div>
          <button
            onClick={() => router.push('/addTeacher')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Teacher
          </button>
        </div>

        {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
        {error && <div className="text-red-500 mb-4">{error}</div>}

       
       
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-gray-900"
            />
          </div>
        </div>

        {(searchTerm) && (
          <div className="mb-4">
            <button
              onClick={() => {
               
                setSearchTerm('');
              }}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm flex items-center"
            >
              <FaFilter className="mr-1" /> Clear Filters
            </button>
          </div>
        )}

        {/* Teacher Cards */}
        {filteredTeachers.length === 0 ? (
          <div>No teachers found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTeachers.map((teacher) => (
              <div key={teacher.id} className="bg-white rounded-lg shadow-lg p-6 relative">
                <div className="absolute top-4 right-4 flex space-x-2">
                  <Link href={`/editTeacher?id=${teacher.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full">
                    <FaEdit />
                  </Link>
                  <button onClick={() => handleDelete(teacher.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full">
                    <FaTrash />
                  </button>
                </div>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                    {teacher.teacher_photo ? (
                      <img
                        src={`http://localhost:1000/uploads/${teacher.teacher_photo}`}
                        alt={teacher.teacher_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-bold text-gray-600">{teacher.teacher_name?.trim().charAt(0).toUpperCase() || '?'}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{teacher.teacher_name}</h3>
                 
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
               
                  <p>Contact: {teacher.phone}</p>
                  <p>Email: {teacher.email}</p>
                  <p>Address: {teacher.address}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      
    </DashboardLayout>
  );
};

export default TeacherDetails;
