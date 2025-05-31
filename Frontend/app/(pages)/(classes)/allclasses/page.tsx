


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
  teacher_name: string;
  student_count?: number;
}

interface ClassCardProps {
  classData: Class;
  onEdit: (classId: string) => void;
  onDelete: (classId: string) => void;
}

const ClassCard: React.FC<ClassCardProps> = ({ 
  classData, 
  onEdit, 
  onDelete 
}) => {
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
            {classData.teacher_name || 'Not Assigned'}
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [deleteLoading, setDeleteLoading] = useState<string>(''); // Store ID of class being deleted

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
      console.log('Classes data received:', classesData);
      
      // Fetch student counts by class
      const studentCountResponse = await fetch(`${baseUrl}/api/api/students/count-by-class`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!studentCountResponse.ok) {
        console.error(`Failed to fetch student counts: ${studentCountResponse.status}`);
        // Continue with classes data even if student count fetch fails
      }

      // Create a map of class_name to student_count
      const studentCountMap: Record<string, number> = {};
      
      if (studentCountResponse.ok) {
        const studentCountData = await studentCountResponse.json();
        console.log('Student count data received:', studentCountData);
        
        if (studentCountData.success && Array.isArray(studentCountData.data)) {
          // Log all class names from the student count data for debugging
          console.log('Class names from student count data:', 
            studentCountData.data.map((item: { class_name: string }) => item.class_name));
          
          studentCountData.data.forEach((item: { class_name: string; student_count: number }) => {
            // Store counts with both original case and lowercase for more flexible matching
            if (item.class_name) {
              studentCountMap[item.class_name] = item.student_count;
              studentCountMap[item.class_name.toLowerCase()] = item.student_count;
              // Also store with trimmed whitespace
              studentCountMap[item.class_name.trim()] = item.student_count;
              studentCountMap[item.class_name.toLowerCase().trim()] = item.student_count;
            }
          });
        }
        console.log('Student count map created:', studentCountMap);
      }

      // Transform the data to match our interface and merge with student counts
      const formattedClasses = Array.isArray(classesData) ? classesData.map(classItem => {
        const className = classItem.class_name || classItem.className || 'Unknown Class';
        
        // Try multiple variations to find a match in the student count map
        let studentCount = 0;
        const possibleKeys = [
          className,
          className.toLowerCase(),
          className.trim(),
          className.toLowerCase().trim()
        ];
        
        // Log the class we're trying to match
        console.log(`Looking for student count for class: ${className}`);
        console.log('Possible keys to match:', possibleKeys);
        
        // Try each possible key until we find a match
        for (const key of possibleKeys) {
          if (studentCountMap[key] !== undefined) {
            studentCount = studentCountMap[key];
            console.log(`Found match with key: ${key}, count: ${studentCount}`);
            break;
          }
        }
        
        return {
          id: classItem.id || classItem._id || String(Math.random()),
          class_name: className,
          section: classItem.section || 'Unknown Section',
          tuition_fees: classItem.tuition_fees || classItem.tuitionFees || 0,
          teacher_name: classItem.teacher_name || classItem.teacherName || 'Not Assigned',
          student_count: studentCount
        };
      }) : [];
      
      console.log('Formatted classes with student counts:', formattedClasses);

      setClasses(formattedClasses);
    } catch (err: any) {
      console.error('Error fetching classes:', err);
      setError(err.message || 'Failed to load classes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load classes on component mount
  useEffect(() => {
    fetchClasses();
  }, []);

  const handleEditClass = (classId: string) => {
    console.log('Edit class:', classId);
    // Navigate to edit page with query parameter
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

      // Remove the deleted class from state
      setClasses(prevClasses => prevClasses.filter(c => c.id !== classId));
      
      // Show success message (you can replace with a toast notification)
      alert('Class deleted successfully!');
      
    } catch (err: any) {
      console.error('Error deleting class:', err);
      setError(err.message || 'Failed to delete class. Please try again.');
    } finally {
      setDeleteLoading('');
    }
  };

  const handleAddNewClass = () => {
    router.push('/addclass'); // Adjust route as needed
  };

  const handleRefresh = () => {
    fetchClasses();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex-1 bg-gray-100 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2 text-gray-600">
              <RefreshCw className="animate-spin" size={20} />
              <span>Loading classes...</span>
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
        {classes.length === 0 && !loading ? (
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
                  onEdit={handleEditClass}
                  onDelete={handleDeleteClass}
                />
                {/* Delete Loading Overlay */}
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