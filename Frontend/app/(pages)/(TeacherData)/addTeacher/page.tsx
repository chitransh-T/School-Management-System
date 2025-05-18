
"use client"
import React, { useState } from 'react';
import { X } from 'lucide-react';
import Sidebar from '@/app/dashboardComponents/sidebar';
import { useRouter } from 'next/navigation';

interface TeacherFormData {
  name: string;
  email: string;
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
  const [formData, setFormData] = useState<TeacherFormData>({
    name: '',
    email: '',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      console.log(formData);
      router.push('/teacher');
    }
  };

  const handleCancel = () => {
    router.push('/teacher');
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
      } else {
        setFormData(prev => ({ ...prev, qualificationCertificate: file }));
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
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-8 bg-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Add New Teacher</h1>
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
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
                        <option value="male" className="text-gray-900">Male</option>
                        <option value="female" className="text-gray-900">Female</option>
                        <option value="other" className="text-gray-900">Other</option>
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

            {/* Submit Button */}
            <div className="mt-6">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Register Teacher
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddTeacherForm;