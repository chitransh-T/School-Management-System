

"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
interface Teacher {
  id: string;
  name: string;
}

const AddNewClassPage: React.FC = () => {
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [formSuccess, setFormSuccess] = useState<boolean>(false);
  
  // Form state
  const [className, setClassName] = useState<string>('');
  const [section, setSection] = useState<string>('');
  const [tuitionFees, setTuitionFees] = useState<string>('');
  const [teacherName, setTeacherName] = useState<string>('');

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Get token from localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Authentication token not found');
          setLoading(false);
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
          throw new Error(`Failed to fetch teachers: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Teachers data received:', data);
        
        // Transform the data to extract teacher names
        const formattedTeachers = Array.isArray(data) ? data.map(teacher => {
          console.log('Processing individual teacher:', teacher); // Debug log
          let displayName = '';
          
          // Try different possible field names for the teacher's name
          // Check for full name field first
          if (teacher.full_name) {
            displayName = teacher.full_name;
          } else if (teacher.fullName) {
            displayName = teacher.fullName;
          } else if (teacher.name) {
            displayName = teacher.name;
          } 
          // Try combining first and last names
          else if (teacher.firstName && teacher.lastName) {
            displayName = `${teacher.firstName} ${teacher.lastName}`;
          } else if (teacher.first_name && teacher.last_name) {
            displayName = `${teacher.first_name} ${teacher.last_name}`;
          } 
          // Try individual name fields
          else if (teacher.firstName) {
            displayName = teacher.firstName;
          } else if (teacher.first_name) {
            displayName = teacher.first_name;
          } else if (teacher.lastName) {
            displayName = teacher.lastName;
          } else if (teacher.last_name) {
            displayName = teacher.last_name;
          }
          // Try other common name fields
          else if (teacher.teacher_name) {
            displayName = teacher.teacher_name;
          } else if (teacher.teacherName) {
            displayName = teacher.teacherName;
          }
          // Only use email as absolute last resort and log a warning
          else if (teacher.email) {
            console.warn('Using email for teacher name - no name field found:', teacher);
            displayName = teacher.email.split('@')[0];
          } else {
            console.warn('No name field found for teacher:', teacher);
            displayName = `Teacher ${teacher._id || teacher.id || 'Unknown'}`;
          }
          
          const formattedTeacher = {
            id: teacher._id || teacher.id || String(Math.random()),
            name: displayName.trim()
          };
          
          console.log('Formatted teacher:', formattedTeacher); // Debug log
          return formattedTeacher;
        }).filter(teacher => teacher.name && teacher.name !== 'Teacher Unknown' && teacher.name.length > 0) : [];
        
        console.log('Formatted teachers:', formattedTeachers);
        setTeachers(formattedTeachers);
        
        if (formattedTeachers.length === 0) {
          setError('No teachers found. Please add teachers first.');
        }
        
      } catch (err) {
        console.error('Error fetching teachers:', err);
        setError('Failed to load teachers. Please try again.');
        // Don't add mock data in production - only set empty array
        setTeachers([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeachers();
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!className) {
      setFormError('Please select a class name');
      return;
    }
    
    if (!section) {
      setFormError('Please select a section');
      return;
    }
    
    if (!tuitionFees || isNaN(Number(tuitionFees)) || Number(tuitionFees) <= 0) {
      setFormError('Please enter a valid tuition fee amount');
      return;
    }
    
    if (!teacherName) {
      setFormError('Please select a teacher');
      return;
    }
    
    try {
      setFormSubmitting(true);
      setFormError('');
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setFormError('Authentication token not found');
        setFormSubmitting(false);
        return;
      }
      
      // Prepare the class data
      const classData = {
        class_name: className,
        section: section,
        tuition_fees: Number(tuitionFees),
        teacher_name: teacherName // This should now be just the teacher's name string
      };
      
      console.log('Submitting class data:', classData);
      
      // Make the API call to register the class
      const response = await fetch(`${baseUrl}/api/classes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(classData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create class');
      }
      
      const result = await response.json();
      console.log('Class created successfully:', result);
      
      // Success
      setFormSuccess(true);
      
      // Reset the form
      setClassName('');
      setSection('');
      setTuitionFees('');
      setTeacherName('');
      
      // Redirect to all classes page after a short delay
      setTimeout(() => {
        router.push('/allclasses');
      }, 2000);
      
    } catch (err: any) {
      console.error('Error creating class:', err);
      setFormError(err.message || 'Failed to create class. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };
  
  return (
    <DashboardLayout>
      <div className="flex-1 bg-gray-100 overflow-auto flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold text-center mb-6 text-gray-800">
            Add New Class
          </h2>
          
          {formSuccess && (
            <div className="mb-4 p-2 bg-green-100 text-green-700 rounded-md text-center">
              Class created successfully! Redirecting...
            </div>
          )}
          
          {formError && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md text-center">
              {formError}
            </div>
          )}
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Class Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class Name <span className="text-purple-600">*</span>
                <span className="ml-2 text-xs text-purple-600">REQUIRED</span>
              </label>
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full px-4 py-2 text-gray-500 border border-purple-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">NAME OF CLASS</option>
                <option value="Nursery">Nursery</option>
                <option value="Lkg">Lkg</option>
                <option value="Ukg">Ukg</option>
                <option value="class 1">class 1</option>
                <option value="class 2">class 2</option>
                <option value="class 3">class 3</option>
                <option value="class 4">class 4</option>
                <option value="class 5">class 5</option>
                <option value="class 6">class 6</option>
                <option value="class 7">class 7</option>
                <option value="class 8">class 8</option>
                <option value="class 9">class 9</option>
                <option value="class 10">class 10</option>
                <option value="class 11">class 11</option>
                <option value="class 12">class 12</option>
              </select>
            </div>

            {/* Section Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section <span className="text-purple-600">*</span>
                <span className="ml-2 text-xs text-purple-600">REQUIRED</span>
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full px-4 py-2 text-gray-500 border border-purple-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Section</option>
                <option value="Section A">Section A</option>
                <option value="Section B">Section B</option>
                <option value="Section C">Section C</option>
                <option value="Section D">Section D</option>
              </select>
            </div>

            {/* Monthly Tuition Fees Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Tuition Fees <span className="text-purple-600">*</span>
                <span className="ml-2 text-xs text-purple-600">REQUIRED</span>
              </label>
              <input
                type="number"
                placeholder="MONTHLY TUITION FEES"
                value={tuitionFees}
                onChange={(e) => setTuitionFees(e.target.value)}
                className="w-full px-4 text-gray-500 py-2 border border-purple-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                min="0"
                step="0.01"
              />
            </div>

            {/* Teacher Selection Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Class Teacher <span className="text-purple-600">*</span>
                <span className="ml-2 text-xs text-purple-600">REQUIRED</span>
              </label>
              <select
                value={teacherName}
                onChange={(e) => {
                  console.log('Selected teacher:', e.target.value);
                  setTeacherName(e.target.value);
                }}
                className="w-full px-4 py-2 text-gray-500 border border-purple-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={loading}
              >
                <option value="">
                  {loading ? "Loading teachers..." : "SELECT TEACHER"}
                </option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.name}>
                    {teacher.name}
                  </option>
                ))}
              </select>
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
              {teachers.length === 0 && !loading && !error && (
                <p className="text-yellow-600 text-xs mt-1">No teachers available</p>
              )}
            </div>

            {/* Create Button */}
            <button
              type="submit"
              disabled={formSubmitting || loading}
              className={`w-full ${formSubmitting || loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white py-2 rounded-full transition-colors flex items-center justify-center`}
            >
              {formSubmitting ? (
                'Creating...' 
              ) : (
                <>
                  <span className="mr-2 text-xl">+</span> Create
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddNewClassPage;