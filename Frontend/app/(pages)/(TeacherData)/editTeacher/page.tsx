'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
import { useAuth } from '@/app/context/AuthContext';

interface Teacher {
  id: number;
  teacher_name: string;
  // email: string;
  date_of_birth: string;
  date_of_joining: string;
  gender: string;
  guardian_name: string;
  qualification: string;
  experience: string;
  salary: string;
  address: string;
  phone: string;
  teacher_photo?: string;
  qualification_certificate?: string;
}

interface ApiResponse {
  success?: boolean;
  teacher?: Teacher;
  message?: string;
  id?: number;
  [key: string]: any; // Allow for any additional properties
}

export default function EditTeacher() {
  // Use useSearchParams to get the teacher ID from the URL query parameters
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { user } = useAuth();
  
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [teacherData, setTeacherData] = useState<Teacher>({
    id: 0,
    teacher_name: '',
    // email: '',
    date_of_birth: '',
    date_of_joining: '',
    gender: '',
    guardian_name: '',
    qualification: '',
    experience: '',
    salary: '',
    address: '',
    phone: '',
    teacher_photo: '',
    qualification_certificate: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for file inputs
  const photoInputRef = useRef<HTMLInputElement>(null);
  const certificateInputRef = useRef<HTMLInputElement>(null);

  // State for file names
  const [photoFileName, setPhotoFileName] = useState('');
  const [certificateFileName, setCertificateFileName] = useState('');

  useEffect(() => {
    const fetchTeacher = async () => {
      if (!id) {
        setError('Teacher ID is required');
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        // First try to get all teachers and filter by ID
        const res = await fetch(`${baseUrl}/api/teachers`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const data = await res.json();
        console.log('API Response:', data);
        
        // Find the teacher with the matching ID
        let teacherData;
        if (Array.isArray(data)) {
          // If it's an array, find the teacher with the matching id
          teacherData = data.find(teacher => teacher.id === Number(id));
          if (!teacherData) throw new Error('Teacher not found in results');
        } else if (data.teacher) {
          // If it has a teacher property, use that
          teacherData = data.teacher;
        } else if ('id' in data) {
          // If it's a direct teacher object
          teacherData = data;
        } else {
          throw new Error('Unexpected API response format');
        }

        console.log('Teacher data:', teacherData);
        
        // Format date fields if they exist
        if (teacherData.date_of_birth) {
          const dob = new Date(teacherData.date_of_birth);
          if (!isNaN(dob.getTime())) {
            teacherData.date_of_birth = dob.toISOString().split('T')[0];
          }
        }

        if (teacherData.date_of_joining) {
          const doj = new Date(teacherData.date_of_joining);
          if (!isNaN(doj.getTime())) {
            teacherData.date_of_joining = doj.toISOString().split('T')[0];
          }
        }

        setTeacherData(teacherData);
        
        // Set file names if they exist
        if (teacherData.teacher_photo) {
          setPhotoFileName(teacherData.teacher_photo.split('/').pop() || '');
        }
        
        if (teacherData.qualification_certificate) {
          setCertificateFileName(teacherData.qualification_certificate.split('/').pop() || '');
        }
      } catch (err: any) {
        console.error('Error fetching teacher:', err);
        setError(err.message || 'Failed to load teacher data');
      } finally {
        setLoading(false);
      }
    };

    fetchTeacher();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTeacherData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'photo' | 'certificate') => {
    const file = e.target.files?.[0];
    if (file) {
      if (fileType === 'photo') {
        setPhotoFileName(file.name);
      } else {
        setCertificateFileName(file.name);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Create FormData object to handle file uploads
      const formData = new FormData();
      
      // Add all text fields
      Object.entries(teacherData).forEach(([key, value]) => {
        if (key !== 'teacher_photo' && key !== 'qualification_certificate' && key !== 'id') {
          formData.append(key, String(value));
        }
      });

      // Add files if they exist
      if (photoInputRef.current?.files?.[0]) {
        formData.append('teacher_photo', photoInputRef.current.files[0]);
      } else if (teacherData.teacher_photo) {
        formData.append('teacher_photo', teacherData.teacher_photo);
      }

      if (certificateInputRef.current?.files?.[0]) {
        formData.append('qualification_certificate', certificateInputRef.current.files[0]);
      } else if (teacherData.qualification_certificate) {
        formData.append('qualification_certificate', teacherData.qualification_certificate);
      }

      const response = await fetch(`${baseUrl}/api/teachers/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Update result:', result);
      
      setSuccess('Teacher updated successfully!');
      
      // Redirect back to teacher details after a short delay
      setTimeout(() => {
        router.push('/TeacherDetails');
      }, 2000);
    } catch (err: any) {
      console.error('Error updating teacher:', err);
      setError(err.message || 'Failed to update teacher');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Teacher</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Personal Information</h2>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  name="teacher_name"
                  value={teacherData.teacher_name}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded-md"
                />
              </div>
              
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={teacherData.date_of_birth}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <select
                  name="gender"
                  value={teacherData.gender}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea
                  name="address"
                  value={teacherData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-2 border rounded-md"
                ></textarea>
              </div>
            </div>
            
            {/* Professional Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Professional Information</h2>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Date of Joining</label>
                <input
                  type="date"
                  name="date_of_joining"
                  value={teacherData.date_of_joining}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Qualification</label>
                <input
                  type="text"
                  name="qualification"
                  value={teacherData.qualification}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Experience (years)</label>
                <input
                  type="text"
                  name="experience"
                  value={teacherData.experience}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Salary</label>
                <input
                  type="text"
                  name="salary"
                  value={teacherData.salary}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Guardian Name</label>
                <input
                  type="text"
                  name="guardian_name"
                  value={teacherData.guardian_name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Profile Photo</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    ref={photoInputRef}
                    onChange={(e) => handleFileChange(e, 'photo')}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Choose File
                  </button>
                  <span className="text-sm text-gray-500">
                    {photoFileName || 'No file chosen'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Qualification Certificate</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    ref={certificateInputRef}
                    onChange={(e) => handleFileChange(e, 'certificate')}
                    accept=".pdf,.doc,.docx,image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => certificateInputRef.current?.click()}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Choose File
                  </button>
                  <span className="text-sm text-gray-500">
                    {certificateFileName || 'No file chosen'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/TeacherDetails')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Updating...' : 'Update Teacher'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}