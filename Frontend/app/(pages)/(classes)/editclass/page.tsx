

"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';

interface Teacher {
  id: string;
  name: string;
}

interface Class {
  id: string;
  class_name: string;
  section: string;
  teacher_id: string;
}

const EditClassPage: React.FC = () => {
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const searchParams = useSearchParams();
  const classId = searchParams.get('id');
  
  // Class data state
  const [classData, setClassData] = useState<Class>({
    id: '',
    class_name: '',
    section: '',
    teacher_id: ''
  });
  
  // UI state
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [formSuccess, setFormSuccess] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // Fetch class data and teachers on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        if (!classId) {
          setError('Class ID is required');
          setLoading(false);
          return;
        }
        
        // Get token from localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Authentication token not found');
          setLoading(false);
          return;
        }
        
        // Fetch all classes and find the one with matching ID
        const classResponse = await fetch(`${baseUrl}/api/classes`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!classResponse.ok) {
          throw new Error(`Failed to fetch classes: ${classResponse.status}`);
        }
        
        const allClasses = await classResponse.json();
        console.log('All classes received:', allClasses);
        
        // Find the specific class by ID
        const classInfo = Array.isArray(allClasses) 
          ? allClasses.find(cls => cls.id === classId || cls.id === Number(classId))
          : null;
          
        if (!classInfo) {
          throw new Error(`Class with ID ${classId} not found`);
        }
        
        console.log('Found class data:', classInfo);
        
        setClassData({
          id: classInfo.id || classId,
          class_name: classInfo.class_name || '',
          section: classInfo.section || '',
          teacher_id: classInfo.teacher_id || ''
        });
        
        // Fetch teachers list
        const teachersResponse = await fetch(`${baseUrl}/api/teachers`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!teachersResponse.ok) {
          throw new Error(`Failed to fetch teachers: ${teachersResponse.status}`);
        }
        
        const teachersData = await teachersResponse.json();
        console.log('Teachers data received:', teachersData);
        
        // Transform the data to extract teacher names
        const formattedTeachers = Array.isArray(teachersData) ? teachersData.map(teacher => {
          let displayName = '';
          
          // Try different possible field names for the teacher's name
          if (teacher.teacher_name) {
            displayName = teacher.teacher_name;
          } else if (teacher.teacherName) {
            displayName = teacher.teacherName;
          } else if (teacher.name) {
            displayName = teacher.name;
          } else if (teacher.full_name) {
            displayName = teacher.full_name;
          } else if (teacher.fullName) {
            displayName = teacher.fullName;
          } else if (teacher.firstName && teacher.lastName) {
            displayName = `${teacher.firstName} ${teacher.lastName}`;
          } else if (teacher.first_name && teacher.last_name) {
            displayName = `${teacher.first_name} ${teacher.last_name}`;
          } else if (teacher.email) {
            displayName = teacher.email.split('@')[0];
          } else {
            displayName = `Teacher ${teacher.id || 'Unknown'}`;
          }
          
          return {
            id: teacher.id || String(Math.random()),
            name: displayName.trim()
          };
        }).filter(teacher => teacher.name && teacher.name.length > 0) : [];
        
        console.log('Formatted teachers:', formattedTeachers);
        setTeachers(formattedTeachers);
        
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [classId, baseUrl]);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setClassData(prev => ({
      ...prev,
     [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!classData.class_name) {
      setFormError('Please enter a class name');
      return;
    }
    
    if (!classData.section) {
      setFormError('Please select a section');
      return;
    }
    
    
    
    if (!classData.teacher_id) {
      setFormError('Please select a teacher');
      return;
    }
    
    try {
      setFormSubmitting(true);
      setFormError('');
      setFormSuccess(false);
      setSuccessMessage('');
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setFormError('Authentication token not found');
        setFormSubmitting(false);
        return;
      }
      
      // Prepare the update data
      const updateData = {
        class_name: classData.class_name,
        teacher_id: classData.teacher_id
      };
      
      console.log('Sending update data:', updateData);
      
      // Make the API call to update the class
      const response = await fetch(`${baseUrl}/api/classes/${classId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update class: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Class updated successfully:', result);
      
      // Success
      setFormSuccess(true);
      setSuccessMessage('Class updated successfully!');
      
      // Redirect to all classes page after a short delay
      setTimeout(() => {
        router.push('/allclasses');
      }, 2000);
      
    } catch (err: any) {
      console.error('Error updating class:', err);
      setFormError(err.message || 'Failed to update class. Please try again.');
      setFormSuccess(false);
    } finally {
      setFormSubmitting(false);
    }
  };
  
  // Handle cancel button
  const handleCancel = () => {
    router.push('/allclasses');
  };
  
  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex-1 bg-gray-100 p-6 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Loading class data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (error) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex-1 bg-gray-100 p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
            <button 
              onClick={() => router.push('/allclasses')} 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Back to All Classes
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="min-h-screen flex-1 bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Class</h1>
          
          {formSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              <p>{successMessage}</p>
            </div>
          )}
          
          {formError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p>{formError}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Class Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Class Name</label>
                <input
                  type="text"
                  name="class_name"
                  value={classData.class_name}
                  readOnly
                  className="w-full p-2 border rounded-md bg-gray-100 text-gray-700"
                />
                <p className="text-xs text-gray-500 mt-1">Class name cannot be changed</p>
                {/* Hidden input to ensure the value is submitted with the form */}
                <input type="hidden" name="class_name" value={classData.class_name} />
              </div>
              
              {/* Section */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Section</label>
                <input
                  type="text"
                  name="section_display"
                  value={classData.section === 'A' ? 'Section A' : 
                         classData.section === 'B' ? 'Section B' : 
                         classData.section === 'C' ? 'Section C' : 
                         classData.section === 'D' ? 'Section D' : classData.section}
                  readOnly
                  className="w-full p-2 border rounded-md bg-gray-100 text-gray-700"
                />
                <p className="text-xs text-gray-500 mt-1">Section cannot be changed</p>
                {/* Hidden input to ensure the value is submitted with the form */}
                <input type="hidden" name="section" value={classData.section} />
              </div>
              
          
              
              {/* Teacher */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Teacher</label>
                <select
                  name="teacher_id"
                  value={classData.teacher_id}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Form Actions */}
            <div className="mt-8 flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formSubmitting}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${formSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {formSubmitting ? 'Updating...' : 'Update Class'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EditClassPage;