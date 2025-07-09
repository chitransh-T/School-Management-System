
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
  yearsOfExperience: string;
  salary: string;
  joiningDate: string;
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
    yearsOfExperience: '',
    salary: '',
    joiningDate: '',
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
    
    // Text fields - no numbers allowed
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (/[0-9]/.test(formData.name)) {
      newErrors.name = 'Name cannot contain numbers';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be 10 digits';
    }
    
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }
    
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }
    
    if (!formData.qualification.trim()) {
      newErrors.qualification = 'Qualification is required';
    } else if (/[0-9]/.test(formData.qualification)) {
      newErrors.qualification = 'Qualification cannot contain numbers';
    }
    
    if (!formData.joiningDate) {
      newErrors.joiningDate = 'Joining date is required';
    }
    
    if (!formData.teacherPhoto || !(formData.teacherPhoto instanceof File)) {
      newErrors.teacherPhoto = 'Teacher photo is required';
    }
    
    if (formData.guardian && /[0-9]/.test(formData.guardian)) {
      newErrors.guardian = 'Guardian name cannot contain numbers';
    }
    
    if (formData.address && /[0-9]/.test(formData.address.replace(/\d+\s*[,-]?\s*/g, ''))) {
      newErrors.address = 'Address text cannot contain numbers except in street numbers';
    }
    
    // Number fields - must be valid numbers
    if (Number(formData.yearsOfExperience) < 0) {
      newErrors.yearsOfExperience = 'Years of experience cannot be negative';
    }
    
    if (Number(formData.salary) < 0) {
      newErrors.salary = 'Salary cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submission started');
    
    if (!validateForm()) {
      setError('Please correct the errors in the form');
      return;
    }

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
    
    if (!photoFile.type.startsWith('image/')) {
      setError('Teacher photo must be an image file (JPG, PNG, etc.)');
      return;
    }
    
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
      const apiFormData = new FormData();
      
      apiFormData.append('teacher_name', formData.name);
      apiFormData.append('email', formData.email);
      apiFormData.append('password', formData.password);
      apiFormData.append('phone', formData.phone);
      apiFormData.append('date_of_birth', formData.dateOfBirth);
      apiFormData.append('date_of_joining', formData.joiningDate);
      
      let dbGenderValue = 'M';
      if (formData.gender === 'male' || formData.gender === 'Male') {
        dbGenderValue = 'M';
      } else if (formData.gender === 'female' || formData.gender === 'Female') {
        dbGenderValue = 'F';
      } else if (formData.gender === 'other' || formData.gender === 'Other') {
        dbGenderValue = 'O';
      }
      
      apiFormData.append('gender', dbGenderValue);
      apiFormData.append('guardian_name', formData.guardian);
      apiFormData.append('qualification', formData.qualification);
      apiFormData.append('experience', formData.yearsOfExperience.toString());
      apiFormData.append('salary', formData.salary.toString());
      apiFormData.append('address', formData.address);
      
      if (teacherPhotoInput?.files?.[0]) {
        apiFormData.append('teacher_photo', teacherPhotoInput.files[0]);
      }
      
      if (qualificationCertificateInput?.files?.[0]) {
        apiFormData.append('qualification_certificate', qualificationCertificateInput.files[0]);
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/registerteacher`, {
        method: 'POST',
        body: apiFormData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to register teacher');
      }

      alert('Teacher registered successfully!');
      (e.target as HTMLFormElement).reset();
      setQualificationCertificateFileName('');
      setTeacherPhotoFileName('');
      router.push('/principledashboard');
    } catch (err: any) {
      console.error('Error details:', err);
      let errorMessage = err.message || 'Failed to register teacher. Please try again.';
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Text field validation (no numbers)
    const textFields = ['name', 'qualification', 'guardian'];
    if (textFields.includes(name) && /[0-9]/.test(value)) {
      setErrors(prev => ({
        ...prev,
        [name]: `${name.charAt(0).toUpperCase() + name.slice(1)} cannot contain numbers`
      }));
      return;
    }

    // Number field validation
    const numberFields = ['yearsOfExperience', 'salary'];
    if (numberFields.includes(name)) {
      if (value !== '' && isNaN(Number(value))) {
        setErrors(prev => ({
          ...prev,
          [name]: `${name.charAt(0).toUpperCase() + name.slice(1)} must be a number`
        }));
        return;
      }
      if (Number(value) < 0) {
        setErrors(prev => ({
          ...prev,
          [name]: `${name.charAt(0).toUpperCase() + name.slice(1)} cannot be negative`
        }));
        return;
      }
    }

    // Phone number validation
    if (name === 'phone' && value !== '' && !/^\d{0,10}$/.test(value)) {
      setErrors(prev => ({
        ...prev,
        phone: 'Phone number must contain only digits and be up to 10 digits long'
      }));
      return;
    }

    // Address validation (allow numbers in street addresses)
    if (name === 'address' && value && /[0-9]/.test(value.replace(/\d+\s*[,-]?\s*/g, ''))) {
      setErrors(prev => ({
        ...prev,
        address: 'Address text cannot contain numbers except in street numbers'
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: numberFields.includes(name) ? (value === '' ? 0 : Number(value)) : value
    }));

    // Clear error when input is valid
    setErrors(prev => ({
      ...prev,
      [name]: undefined
    }));
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
                        className={`mt-1 block w-full rounded-md border ${
                          errors.guardian ? 'border-red-500' : 'border-gray-300'
                        } px-3 py-2 focus:border-blue-500 focus:outline-none text-gray-900`}
                      />
                      {errors.guardian && <p className="text-red-500 text-sm mt-1">{errors.guardian}</p>}
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
                        className={`mt-1 block w-full rounded-md border ${
                          errors.yearsOfExperience ? 'border-red-500' : 'border-gray-300'
                        } px-3 py-2 focus:border-blue-500 focus:outline-none text-gray-900`}
                      />
                      {errors.yearsOfExperience && <p className="text-red-500 text-sm mt-1">{errors.yearsOfExperience}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900">
                        Salary
                      </label>
                      <input
                        type="number"
                        name="salary"
                        placeholder="Enter monthly salary"
                        value={formData.salary}
                        onChange={handleChange}
                        min="0"
                        className={`mt-1 block w-full rounded-md border ${
                          errors.salary ? 'border-red-500' : 'border-gray-300'
                        } px-3 py-2 focus:border-blue-500 focus:outline-none text-gray-900`}
                      />
                      {errors.salary && <p className="text-red-500 text-sm mt-1">{errors.salary}</p>}
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
                        className={`mt-1 block w-full rounded-md border ${
                          errors.address ? 'border-red-500' : 'border-gray-300'
                        } px-3 py-2 focus:border-blue-500 focus:outline-none text-gray-900`}
                      />
                      {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
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