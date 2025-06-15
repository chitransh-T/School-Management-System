




"use client";
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
import { Edit, Trash2, Plus, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Class {
  id: string;
  class_name: string;
  section: string;
  tuition_fees: number;
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

const ClassCard: React.FC<ClassCardProps> = ({ 
  classData, 
  teachers,
  onEdit, 
  onDelete 
}) => {
  // Find teacher name from teachers list by teacherId
  const teacherName = teachers.find(
    (teacher) => teacher.id === classData.teacher_id
  )?.name || 'No Teacher Assigned';

  const handleEdit = () => {
    onEdit(classData.id);
  };

  const handleDelete = () => {
    onDelete(classData.id);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 w-full relative group hover:shadow-lg transition-shadow">
      {/* Action Icons */}
      <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleEdit}
          className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
          title="Edit Class"
        >
          <Edit size={14} />
        </button>
        <button
          onClick={handleDelete}
          className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
          title="Delete Class"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="text-2xl font-bold mb-2 text-gray-800">
        {classData.class_name}
      </div>
      <div className="text-sm uppercase text-gray-500 mb-4">
        {classData.section}
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Total Students
          </div>
          <div className="text-lg font-bold text-gray-800">
            {classData.student_count || 0}
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Teacher
          </div>
          <div className="text-sm font-semibold text-gray-700">
            {teacherName}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Monthly Fees
          </div>
          <div className="text-sm font-semibold text-green-600">
            Rs:- {classData.tuition_fees}
          </div>
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
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchingTeachers, setFetchingTeachers] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [deleteLoading, setDeleteLoading] = useState<string>('');

  // Fetch teachers from backend
  const fetchTeachers = async () => {
    try {
      setFetchingTeachers(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please login again.');
        router.push('/login');
        return;
      }

      const response = await fetch(`${baseUrl}/api/teachers`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expired. Please login again.');
          router.push('/login');
          return;
        }
        throw new Error(`Failed to fetch teachers: ${response.status}`);
      }

      const teachersData = await response.json();
      const formattedTeachers = Array.isArray(teachersData) 
        ? teachersData.map(teacher => ({
            id: teacher._id || teacher.id || '',
            name: teacher.teacher_name || 'Unknown Teacher'
          })).filter(teacher => teacher.id) // Filter out invalid teachers
        : [];

      setTeachers(formattedTeachers);
    } catch (err: any) {
      console.error('Error fetching teachers:', err);
      setError(err.message || 'Failed to load teachers. Please try again.');
    } finally {
      setFetchingTeachers(false);
    }
  };

  // Fetch classes and student counts from backend
  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please login again.');
        router.push('/login');
        return;
      }

      // Fetch classes
      const classesResponse = await fetch(`${baseUrl}/api/classes`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!classesResponse.ok) {
        if (classesResponse.status === 401) {
          setError('Session expired. Please login again.');
          router.push('/login');
          return;
        }
        throw new Error(`Failed to fetch classes: ${classesResponse.status}`);
      }

      const classesData = await classesResponse.json();
      
      // Fetch student counts by class
      const studentCountResponse = await fetch(`${baseUrl}/api/api/students/count-by-class`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Create a map of class_name to student_count
      const studentCountMap: Record<string, number> = {};
      
      if (studentCountResponse.ok) {
        const studentCountData = await studentCountResponse.json();
        
        if (studentCountData.success && Array.isArray(studentCountData.data)) {
          studentCountData.data.forEach((item: { class_name: string; student_count: number }) => {
            if (item.class_name) {
              studentCountMap[item.class_name] = item.student_count;
              studentCountMap[item.class_name.toLowerCase()] = item.student_count;
              studentCountMap[item.class_name.trim()] = item.student_count;
              studentCountMap[item.class_name.toLowerCase().trim()] = item.student_count;
            }
          });
        }
      }

      // Transform the data to match our interface and merge with student counts
      const formattedClasses = Array.isArray(classesData) ? classesData.map(classItem => {
        const className = classItem.class_name || classItem.className || 'Unknown Class';
        
        let studentCount = 0;
        const possibleKeys = [
          className,
          className.toLowerCase(),
          className.trim(),
          className.toLowerCase().trim()
        ];
        
        for (const key of possibleKeys) {
          if (studentCountMap[key] !== undefined) {
            studentCount = studentCountMap[key];
            break;
          }
        }
        
        return {
          id: classItem.id || classItem._id || String(Math.random()),
          class_name: className,
          section: classItem.section || 'Unknown Section',
          tuition_fees: classItem.tuition_fees || classItem.tuitionFees || 0,
          teacher_id: classItem.teacher_id || 'No Teacher Assigned',
          student_count: studentCount
        };
      }) : [];
      
      setClasses(formattedClasses);
    } catch (err: any) {
      console.error('Error fetching classes:', err);
      setError(err.message || 'Failed to load classes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        await fetchClasses();
        await fetchTeachers();
      } else {
        setError('Authentication token not found. Please login again.');
        router.push('/login');
      }
    };
    
    loadData();
  }, []);

  const handleEditClass = (classId: string) => {
    router.push(`/editclass?id=${classId}`);
  };

  const handleDeleteClass = async (classId: string) => {
    const classToDelete = classes.find(c => c.id === classId);
    const confirmMessage = `Are you sure you want to delete "${classToDelete?.class_name} - ${classToDelete?.section}"?\n\nThis action cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setDeleteLoading(classId);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please login again.');
        return;
      }

      const response = await fetch(`${baseUrl}/api/classes/${classId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete class');
      }

      setClasses(prevClasses => prevClasses.filter(c => c.id !== classId));
      alert('Class deleted successfully!');
      
    } catch (err: any) {
      console.error('Error deleting class:', err);
      setError(err.message || 'Failed to delete class. Please try again.');
    } finally {
      setDeleteLoading('');
    }
  };

  const handleAddNewClass = () => {
    router.push('/addclass');
  };

  const handleRefresh = () => {
    fetchClasses();
    fetchTeachers();
  };

  if (loading || fetchingTeachers) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex-1 bg-gray-100 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2 text-gray-600">
              <RefreshCw className="animate-spin" size={20} />
              <span>Loading data...</span>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen flex-1 bg-gray-100 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl text-gray-500 font-bold">Classes | All Classes</h1>
          <div className="flex space-x-3">
            <button
              onClick={handleRefresh}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              title="Refresh Data"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={handleAddNewClass}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus size={16} />
              <span>Add New Class</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button
                onClick={() => setError('')}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Classes Grid */}
        {classes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">No classes found</div>
            <button
              onClick={handleAddNewClass}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus size={20} />
              <span>Add Your First Class</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {classes.map((classData) => (
              <div key={classData.id} className="relative">
                <ClassCard
                  classData={classData}
                  teachers={teachers}
                  onEdit={handleEditClass}
                  onDelete={handleDeleteClass}
                />
                {deleteLoading === classData.id && (
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