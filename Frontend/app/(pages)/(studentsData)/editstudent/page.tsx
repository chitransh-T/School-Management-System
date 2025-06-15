'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
import { useAuth } from '@/app/context/AuthContext';

interface Student {
  id: number;
  student_name: string;
  registration_number: string;
  assigned_class: string;
  assigned_section: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  date_of_birth: string;
  country: string;
  father_name: string;
  mother_name: string;
  username: string;
  password: string;
  student_photo?: string;
  birth_certificate?: string;
}

interface ApiResponse {
  success?: boolean;
  student?: Student;
  message?: string;
  id?: number;
  [key: string]: any; // Allow for any additional properties
}

export default function EditStudent() {
  // Use useSearchParams to get the student ID from the URL query parameters
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { user } = useAuth();
  
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [studentData, setStudentData] = useState<Student>({
    id: 0,
    student_name: '',
    registration_number: '',
    assigned_class: '',
    assigned_section: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    date_of_birth: '',
    country: '',
    father_name: '',
    mother_name: '',
    username: '',
    password: '',
    student_photo: '',
    birth_certificate: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudent = async () => {
      if (!id) {
        setError('Student ID is required');
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        // First try to get all students and filter by ID
        const res = await fetch(`${baseUrl}/api/students`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const data = await res.json();
        console.log('API Response:', data);
        
        // Find the student with the matching ID
        let studentData;
        if (Array.isArray(data)) {
          // If it's an array, find the student with the matching id
          studentData = data.find(student => student.id === Number(id));
          if (!studentData) throw new Error('Student not found in results');
        } else if (data.student) {
          // If it has a student property, use that
          studentData = data.student;
        } else if ('id' in data) {
          // If it's a direct student object
          studentData = data as unknown as Student;
        } else {
          throw new Error('Student data not found in response');
        }
        
        console.log('Found student data:', studentData);
        
        const formattedStudent = {
          ...studentData,
          date_of_birth: studentData.date_of_birth 
            ? new Date(studentData.date_of_birth).toISOString().split('T')[0]
            : ''
        };
        
        setStudentData(formattedStudent);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Fetch failed');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchStudent();
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (!studentData) return;

    setStudentData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: value
      };
    });
  };

  const validateForm = () => {
    // Implement proper validation
    if (!studentData.student_name.trim()) {
      setError('Student name is required');
      return false;
    }
    if (!studentData.registration_number.trim()) {
      setError('Registration number is required');
      return false;
    }
    if (!studentData.assigned_class.trim()) {
      setError('Class is required');
      return false;
    }
    // if (!studentData.phone.trim()) {
    //   setError('Phone number is required');
    //   return false;
    // }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Create FormData for file uploads
      const formData = new FormData();
      
      // Append all student data
      Object.entries(studentData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && key !== 'id') {
          formData.append(key, value.toString());
        }
      });

      // Append files if they were selected
      const studentPhotoInput = document.querySelector<HTMLInputElement>('input[name="student_photo"]');
      const birthCertInput = document.querySelector<HTMLInputElement>('input[name="birth_certificate"]');

      if (studentPhotoInput?.files?.[0]) {
        formData.append('student_photo', studentPhotoInput.files[0]);
      }
      if (birthCertInput?.files?.[0]) {
        formData.append('birth_certificate', birthCertInput.files[0]);
      }

      console.log('Updating student with ID:', id);
      console.log('Form data keys:', [...formData.keys()]);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Use the correct API endpoint format
      const response = await fetch(`${baseUrl}/api/students/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
        // Don't set Content-Type header when sending FormData
        // The browser will set it automatically with the correct boundary
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update student');
      }

      // Show success message
      alert('Student updated successfully');
      router.push('/studentdetails');
    } catch (err) {
      console.error('Error updating student:', err);
      setError(err instanceof Error ? err.message : 'Failed to update student');
    } finally {
      setLoading(false);
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

  if (error) {
    return (
      <DashboardLayout>
        <div className="w-full p-4">
          <p className="text-red-500">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!studentData) {
    return (
      <DashboardLayout>
        <div className="w-full p-4">Student not found</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-5xl mx-auto my-12">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Student Details</h1>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                name="student_name"
                value={studentData.student_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
              <input
                type="text"
                name="registration_number"
                value={studentData.registration_number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <input
                type="text"
                name="assigned_class"
                value={studentData.assigned_class}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <input
                type="text"
                name="assigned_section"
                value={studentData.assigned_section}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                required
              />
            </div>

            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <input
                type="tel"
                name="phone"
                value={studentData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                required
              />
            </div> */}

            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={studentData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                required
              />
            </div> */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                name="date_of_birth"
                value={studentData.date_of_birth}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                name="gender"
                value={studentData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

           

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
              <input
                type="text"
                name="father_name"
                value={studentData.father_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mother's Name</label>
              <input
                type="text"
                name="mother_name"
                value={studentData.mother_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                required
              />
            </div>

            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                name="username"
                value={studentData.username}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={studentData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                required
              />
            </div> */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student Photo</label>
              <input
                type="file"
                name="student_photo"
                accept="image/*"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
              {studentData.student_photo && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Current photo: {studentData.student_photo}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birth Certificate</label>
              <input
                type="file"
                name="birth_certificate"
                accept=".pdf,.jpg,.jpeg,.png"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
              {studentData.birth_certificate && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Current file: {studentData.birth_certificate}</p>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                name="address"
                value={studentData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={() => router.push('/studentdetails')}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Update Student
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}