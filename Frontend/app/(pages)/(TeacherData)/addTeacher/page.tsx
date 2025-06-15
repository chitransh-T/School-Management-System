"use client"
import React, { useState } from 'react';
import { X } from 'lucide-react';
import Sidebar from '@/app/dashboardComponents/sidebar';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';

interface TeacherFormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  qualification: string;
  department: string;
  subject: string;
  yearsOfExperience: number;
  salary: number;
  joiningDate: string;
  employeeId: string;
  guardian: string;
  qualificationCertificate: File | null;
  teacherPhoto: string | File | null;
}

const AddTeacherForm = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teacherPhotoFileName, setTeacherPhotoFileName] = useState('');
  const [qualificationCertificateFileName, setQualificationCertificateFileName] = useState('');
  const [formData, setFormData] = useState<TeacherFormData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    qualification: '',
    department: '',
    subject: '',
    yearsOfExperience: 0,
    salary: 0,
    joiningDate: '',
    employeeId: '',
    guardian: '',
    qualificationCertificate: null,
    teacherPhoto: null
  });

  const [expandedSections, setExpandedSections] = useState({
    personalInfo: true,
    professionalInfo: false,
    documents: false
  });

  const [errors, setErrors] = useState<Partial<TeacherFormData>>({});

  const validateForm = () => {
    const newErrors: Partial<TeacherFormData> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.qualification) newErrors.qualification = 'Qualification is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.subject) newErrors.subject = 'Subject is required';
    if (!formData.joiningDate) newErrors.joiningDate = 'Joining date is required';
    if (!formData.employeeId) newErrors.employeeId = 'Employee ID is required';
    if (!formData.teacherPhoto || !(formData.teacherPhoto instanceof File)) {
      newErrors.teacherPhoto = 'Teacher photo is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submission started');
    
    // Log the current form data for debugging
    console.log('Current form data:', formData);
    
    // Don't validate form here - we'll check individual fields below
    // This prevents the form from being blocked by validation

    // Create FormData object for file uploads
    const formDataObj = new FormData(e.target as HTMLFormElement);
    
    // Get file inputs
    const teacherPhotoInput = document.querySelector<HTMLInputElement>('input[name="teacher_photo"]');
    const qualificationCertificateInput = document.querySelector<HTMLInputElement>('input[name="qualification_certificate"]');

    // Check if files are selected
    if (!teacherPhotoInput?.files?.[0]) {
      setError('Teacher photo is required.');
      return;
    }
    
    if (!qualificationCertificateInput?.files?.[0]) {
      setError('Qualification certificate is required.');
      return;
    }
    
    // Validate file types
    const photoFile = teacherPhotoInput.files[0];
    const certFile = qualificationCertificateInput.files[0];
    
    // Check photo file type (should be image)
    if (!photoFile.type.startsWith('image/')) {
      setError('Teacher photo must be an image file (JPG, PNG, etc.)');
      return;
    }
    
    // Check certificate file type (should be PDF)
    if (certFile.type !== 'application/pdf') {
      setError('Qualification certificate must be a PDF file');
      return;
    }

    if (!user?.email) {
      setError('You must be logged in to register a teacher.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Map form field names to match backend expectations
      // The backend expects: teacher_name, email, date_of_birth, date_of_joining, gender, etc.
      
      // Clear existing form data and rebuild with correct field names
      const apiFormData = new FormData();
      
      // Map fields to match backend expectations
      apiFormData.append('teacher_name', formData.name);
      apiFormData.append('email', formData.email);
      apiFormData.append('password', formData.password);
      apiFormData.append('phone', formData.phone);
      apiFormData.append('date_of_birth', formData.dateOfBirth);
      apiFormData.append('date_of_joining', formData.joiningDate);
      // Ensure gender is properly capitalized to match database constraints
      // The database constraint requires specific values (likely 'Male', 'Female', 'Other')
      console.log('Original gender value:', formData.gender);
      
      // The database has a specific check constraint for gender values
      // Let's hardcode 'M' for Male, 'F' for Female, and 'O' for Other
      // These are likely the exact values the database constraint expects
      let dbGenderValue = 'M'; // Default to 'M'
      
      if (formData.gender === 'male' || formData.gender === 'Male') {
        dbGenderValue = 'M';
      } else if (formData.gender === 'female' || formData.gender === 'Female') {
        dbGenderValue = 'F';
      } else if (formData.gender === 'other' || formData.gender === 'Other') {
        dbGenderValue = 'O';
      }
      
      console.log('Database gender value:', dbGenderValue);
      apiFormData.append('gender', dbGenderValue);
      apiFormData.append('guardian_name', formData.guardian);
      apiFormData.append('qualification', formData.qualification);
      apiFormData.append('experience', formData.yearsOfExperience.toString());
      apiFormData.append('salary', formData.salary.toString());
      apiFormData.append('address', formData.address);
      
      // Add department and subject fields that might be used in the frontend but not in backend
      // These won't be processed by the backend but will be included in the form data
      apiFormData.append('department', formData.department);
      apiFormData.append('subject', formData.subject);
      apiFormData.append('employee_id', formData.employeeId);
      
      // Add files
      if (teacherPhotoInput?.files?.[0]) {
        apiFormData.append('teacher_photo', teacherPhotoInput.files[0]);
      }
      
      if (qualificationCertificateInput?.files?.[0]) {
        apiFormData.append('qualification_certificate', qualificationCertificateInput.files[0]);
      }

      // Get the authentication token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Send form data to the backend
      console.log('Sending teacher registration data to API...');
      
      // Log the form data being sent (for debugging)
      for (const pair of apiFormData.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
      }
      
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/registerteacher`, {
        method: 'POST',
        body: apiFormData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to register teacher');
      }

      alert('Teacher registered successfully!');
      
      // Reset the form
      (e.target as HTMLFormElement).reset();
      setQualificationCertificateFileName('');
      setTeacherPhotoFileName('');
      
      // Redirect to teacher list page
      router.push('/principledashboard');
    } catch (err: any) {
      console.error('Error details:', err);
      
      // Provide a more detailed error message
      let errorMessage = 'Failed to register teacher. Please try again.';
      
      if (err.message) {
        errorMessage = err.message;
      }
      
      // Set the error message for display
      setError(errorMessage);
      
      // Show error in alert for immediate feedback
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name as keyof TeacherFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isPhoto: boolean) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (isPhoto) {
        setFormData(prev => ({ ...prev, teacherPhoto: file }));
        setErrors(prev => ({ ...prev, teacherPhoto: undefined }));
        setTeacherPhotoFileName(file.name);
      } else {
        setFormData(prev => ({ ...prev, qualificationCertificate: file }));
        setQualificationCertificateFileName(file.name);
      }
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <DashboardLayout>
      <div className="flex-1 p-8 bg-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl text-gray-500 font-bold">Add New Teacher</h1>
            
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow-lg p-6">
            {/* Personal Information Section */}
            <div className="border rounded-lg overflow-hidden">
              <button
                type="button"
                className="w-full p-4 text-left font-bold bg-gray-100 hover:bg-gray-200 flex justify-between items-center"
                onClick={() => toggleSection('personalInfo')}
              >
                <span className="text-lg font-medium text-gray-900">Personal Information</span>
                <span>{expandedSections.personalInfo ? '−' : '+'}</span>
              </button>
              
              {expandedSections.personalInfo && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900">
                        Full Name*
                      </label>
                      <input
                        type="text"
                        name="name"
                        placeholder="Enter full name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border ${
                          errors.name ? 'border-red-500' : 'border-gray-300'
                        } px-3 py-2 focus:border-blue-500 focus:outline-none text-gray-900`}
                      />
                      {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900">
                        Email*
                      </label>
                      <input
                        type="email"
                        name="email"
                        placeholder="Enter email address"
                        value={formData.email}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        } px-3 py-2 focus:border-blue-500 focus:outline-none text-gray-900`}
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900">
                        Password*
                      </label>
                      <input
                        type="password"
                        name="password"
                        placeholder="Enter password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border ${
                          errors.password ? 'border-red-500' : 'border-gray-300'
                        } px-3 py-2 focus:border-blue-500 focus:outline-none text-gray-900`}
                      />
                      {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                    </div>

                     <div>
                      <label className="block text-sm font-medium text-gray-900">
                        Joining Date*
                      </label>
                      <input
                        type="date"
                        name="joiningDate"
                        placeholder="Select joining date"
                        value={formData.joiningDate}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border ${
                          errors.joiningDate ? 'border-red-500' : 'border-gray-300'
                        } px-3 py-2 focus:border-blue-500 focus:outline-none text-gray-900`}
                      />
                      {errors.joiningDate && <p className="text-red-500 text-sm mt-1">{errors.joiningDate}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900">
                        Date of Birth*
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        placeholder="Select date of birth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border ${
                          errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                        } px-3 py-2 focus:border-blue-500 focus:outline-none text-gray-900`}
                      />
                      {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900">
                        Gender*
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border ${
                          errors.gender ? 'border-red-500' : 'border-gray-300'
                        } px-3 py-2 focus:border-blue-500 focus:outline-none text-gray-900`}
                      >
                        <option value="" className="text-gray-500">Select gender</option>
                        <option value="Male" className="text-gray-900">Male</option>
                        <option value="Female" className="text-gray-900">Female</option>
                        <option value="Other" className="text-gray-900">Other</option>
                      </select>
                      {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
                    </div>

                    

                   
                  </div>
                </div>
              )}
            </div>

            {/* Professional Information Section */}
            <div className="border rounded-lg overflow-hidden">
              <button
                type="button"
                className="w-full p-4 text-left font-bold bg-gray-100 hover:bg-gray-200 flex justify-between items-center"
                onClick={() => toggleSection('professionalInfo')}
              >
                <span className="text-lg font-medium text-gray-900">Professional Information</span>
                <span>{expandedSections.professionalInfo ? '−' : '+'}</span>
              </button>
              
              {expandedSections.professionalInfo && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900">
                        Father/Husband Name
                      </label>
                      <input
                        type="text"
                        name="guardian"
                        placeholder="Enter guardian name"
                        value={formData.guardian}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900">
                        Qualification*
                      </label>
                      <input
                        type="text"
                        name="qualification"
                        placeholder="Enter highest qualification"
                        value={formData.qualification}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border ${
                          errors.qualification ? 'border-red-500' : 'border-gray-300'
                        } px-3 py-2 focus:border-blue-500 focus:outline-none text-gray-900`}
                      />
                      {errors.qualification && <p className="text-red-500 text-sm mt-1">{errors.qualification}</p>}
                    </div>

                    
                    <div>
                      <label className="block text-sm font-medium text-gray-900">
                        Years of Experience
                      </label>
                      <input
                        type="number"
                        name="yearsOfExperience"
                        placeholder="Enter years of experience"
                        value={formData.yearsOfExperience}
                        onChange={handleChange}
                        min="0"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900">
                        Monthly Salary
                      </label>
                      <input
                        type="number"
                        name="salary"
                        placeholder="Enter monthly salary"
                        value={formData.salary}
                        onChange={handleChange}
                        min="0"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                      />
                    </div>

                   

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-900">
                        Address
                      </label>
                      <textarea
                        name="address"
                        placeholder="Enter full address"
                        value={formData.address}
                        onChange={handleChange}
                        rows={3}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                      />
                    </div>
                     <div>
                  <label className="block text-sm font-medium text-gray-900">
                    Phone Number*
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    } px-3 py-2 focus:border-blue-500 focus:outline-none text-gray-900`}
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                  </div>
                </div>
              )}
            </div>

            {/* Documents Section */}
            <div className="border rounded-lg overflow-hidden">
              <button
                type="button"
                className="w-full p-4 text-left font-bold bg-gray-100 hover:bg-gray-200 flex justify-between items-center"
                onClick={() => toggleSection('documents')}
              >
                <span className="text-lg font-medium text-gray-900">Documents</span>
                <span>{expandedSections.documents ? '−' : '+'}</span>
              </button>
              
              {expandedSections.documents && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Qualification Document
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        id="qualificationDoc"
                        name="qualification_certificate"
                        onChange={(e) => handleFileChange(e, false)}
                        className="hidden"
                      />
                      <label
                        htmlFor="qualificationDoc"
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
                      >
                        Upload
                      </label>
                      {formData.qualificationCertificate && (
                        <span className="text-sm">
                          Selected: {formData.qualificationCertificate.name}
                        </span>
                      )}
                    </div>
                  </div>
                 

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Teacher Photo*
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        id="teacherPhoto"
                        name="teacher_photo"
                        onChange={(e) => handleFileChange(e, true)}
                        className="hidden"
                        accept="image/*"
                      />
                      <label
                        htmlFor="teacherPhoto"
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
                      >
                        Upload
                      </label>
                      {formData.teacherPhoto && (
                        <span className="text-sm">
                          Selected: {formData.teacherPhoto instanceof File ? formData.teacherPhoto.name : ''}
                        </span>
                      )}
                    </div>
                    {errors.teacherPhoto && <p className="text-red-500 text-sm mt-1">{String(errors.teacherPhoto)}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                onClick={() => console.log('Button clicked')}
              >
                {isSubmitting ? 'Registering...' : 'Register Teacher'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddTeacherForm;