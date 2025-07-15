

"use client";
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
import { Edit, Trash2, Plus, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Class {
  id: string;
  class_name: string;
  section: string;
  teacher_id: string;
  student_count?: number;
}

interface Teacher {
  id: string;
  name: string;
}

interface ClassCardProps {
  classData: Class;
  teachers: Teacher[];
  onEdit: (classId: string) => void;
  onDelete: (classId: string) => void;
}

const ClassCard: React.FC<ClassCardProps> = ({ classData, teachers, onEdit, onDelete }) => {
  const teacherName = teachers.find(t => t.id === classData.teacher_id)?.name || 'No Teacher Assigned';

  return (
    <div className="bg-white rounded-lg shadow-md p-4 w-full relative group hover:shadow-lg transition-shadow">
      <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(classData.id)} className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors">
          <Edit size={14} />
        </button>
        <button onClick={() => onDelete(classData.id)} className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors">
          <Trash2 size={14} />
        </button>
      </div>

      <div className="text-2xl font-bold mb-2 text-gray-800">{classData.class_name}</div>
      <div className="text-sm uppercase text-gray-500 mb-4">{classData.section}</div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">Total Students</div>
          <div className="text-lg font-bold text-gray-800">{classData.student_count || 0}</div>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">Class Teacher</div>
          <div className="text-sm font-semibold text-green-700">{teacherName}</div>
        </div>
      </div>
    </div>
  );
};

const AllClassesPage: React.FC = () => {
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingTeachers, setFetchingTeachers] = useState(false);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState('');

  // Class hierarchy for sorting
  const classHierarchy = [
    'Nursery',
    'Lkg',
    'Ukg',
    'class 1',
    'class 2',
    'class 3',
    'class 4',
    'class 5',
    'class 6',
    'class 7',
    'class 8',
    'class 9',
    'class 10',
    'class 11',
    'class 12'
  ];

  // Section hierarchy for sorting
  const sectionHierarchy = [
    'Section A',
    'Section B',
    'Section C',
    'Section D'
  ];

  // Function to get class order
  const getClassOrder = (className: string): number => {
    const index = classHierarchy.findIndex(cls => cls.toLowerCase() === className.toLowerCase());
    return index !== -1 ? index : 999; // Put unknown classes at the end
  };

  // Function to get section order
  const getSectionOrder = (sectionName: string): number => {
    const index = sectionHierarchy.findIndex(sec => sec.toLowerCase() === sectionName.toLowerCase());
    return index !== -1 ? index : 999; // Put unknown sections at the end
  };

  // Function to sort classes
  const sortClasses = (classesToSort: Class[]): Class[] => {
    return [...classesToSort].sort((a, b) => {
      // First sort by class hierarchy
      const classOrderA = getClassOrder(a.class_name);
      const classOrderB = getClassOrder(b.class_name);
      
      if (classOrderA !== classOrderB) {
        return classOrderA - classOrderB;
      }
      
      // If same class, sort by section
      const sectionOrderA = getSectionOrder(a.section);
      const sectionOrderB = getSectionOrder(b.section);
      
      return sectionOrderA - sectionOrderB;
    });
  };

  const fetchTeachers = async () => {
    try {
      setFetchingTeachers(true);
      const token = localStorage.getItem('token');
      if (!token) return router.push('/login');
      const res = await fetch(`${baseUrl}/api/teachers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const formatted = Array.isArray(data)
        ? data.map(t => ({ id: t._id || t.id || '', name: t.teacher_name || 'Unknown Teacher' })).filter(t => t.id)
        : [];
      setTeachers(formatted);
    } catch (err: any) {
      console.error('Teacher fetch error:', err);
      setError(err.message || 'Failed to fetch teachers.');
    } finally {
      setFetchingTeachers(false);
    }
  };

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return router.push('/login');

      const [classRes, studentCountRes] = await Promise.all([
        fetch(`${baseUrl}/api/classes`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/api/students/count-by-class`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const classData = await classRes.json();
      const studentData = await studentCountRes.json();

      // Build count map with class+section
      const studentCountMap: Record<string, number> = {};
      if (studentData.success && Array.isArray(studentData.data)) {
        studentData.data.forEach((item: { class_name: string; section: string; student_count: number }) => {
          const key = `${item.class_name.trim().toLowerCase()}-${item.section.trim().toLowerCase()}`;
          studentCountMap[key] = item.student_count;
        });
      }

      const formattedClasses = Array.isArray(classData)
        ? classData.map(cls => {
            const className = cls.class_name || cls.className || 'Unknown';
            const section = cls.section || 'Unknown';
            const key = `${className.trim().toLowerCase()}-${section.trim().toLowerCase()}`;
            return {
              id: cls.id || cls._id || String(Math.random()),
              class_name: className,
              section: section,
              teacher_id: cls.teacher_id || '',
              student_count: studentCountMap[key] || 0
            };
          })
        : [];

      // Sort classes using the sorting function
      const sortedClasses = sortClasses(formattedClasses);
      setClasses(sortedClasses);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to load class data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchClasses();
      fetchTeachers();
    } else {
      router.push('/login');
    }
  }, []);

  const handleEditClass = (id: string) => router.push(`/editclass?id=${id}`);
  const handleDeleteClass = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;
    try {
      setDeleteLoading(id);
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${baseUrl}/api/classes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Delete failed');
      // Update classes and maintain sorting
      setClasses(prev => sortClasses(prev.filter(c => c.id !== id)));
      alert('Class deleted successfully');
    } catch (err: any) {
      setError(err.message || 'Delete failed.');
    } finally {
      setDeleteLoading('');
    }
  };

  const handleAddNewClass = () => router.push('/addclass');
  const handleRefresh = () => {
    fetchClasses();
    fetchTeachers();
  };

  if (loading || fetchingTeachers) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <RefreshCw className="animate-spin" size={20} />
          <span className="ml-2 text-gray-600">Loading data...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen flex-1 bg-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-600">Classes | All Classes</h1>
          <div className="flex space-x-3">
            <button onClick={handleRefresh} className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg">
              <RefreshCw size={16} />
            </button>
            <button onClick={handleAddNewClass} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus size={16} className="mr-2" />
              Add New Class
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError('')} className="text-red-500">×</button>
            </div>
          </div>
        )}

        {classes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No classes found</div>
            <button onClick={handleAddNewClass} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus size={20} className="mr-2" />
              Add Your First Class
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {classes.map(cls => (
              <div key={cls.id} className="relative">
                <ClassCard classData={cls} teachers={teachers} onEdit={handleEditClass} onDelete={handleDeleteClass} />
                {deleteLoading === cls.id && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                    <div className="flex items-center space-x-2 text-red-600">
                      <RefreshCw className="animate-spin" size={16} />
                      <span className="text-sm">Deleting...</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AllClassesPage;