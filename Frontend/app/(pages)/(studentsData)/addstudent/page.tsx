"use client";
import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '@/app/dashboardComponents/sidebar';
import { useAuth } from '@/app/context/AuthContext';
import { fetchWithAuth } from '@/app/utils/api';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
import { useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface ClassData {
  id: string;
  class_name: string;
  section: string;
  tuition_fees: number;
  teacher_name: string;
}

const PreviewPage = () => {
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  // State for classes and sections fetched from backend
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [loadingClasses, setLoadingClasses] = useState<boolean>(false);
  const [classError, setClassError] = useState<string>('');  
  
  // State for selected class and its available sections
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [availableSections, setAvailableSections] = useState<string[]>([]);

  const { user } = useAuth(); // Get the current admin's data

  const [birthCertFileName, setBirthCertFileName] = useState('');
  const [photoFileName, setPhotoFileName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Validation states
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  
  // Form data state to track input values
  const [formData, setFormData] = useState({
    student_name: '',
    registration_number: '',
    date_of_birth: '',
    gender: '',
    address: '',
    assigned_class: '',
    assigned_section: '',
    father_name: '',
    mother_name: '',
    email: '',
    phone: ''
  });

  // Validation functions
  const validateTextOnly = (value: string): boolean => {
    return /^[a-zA-Z\s]+$/.test(value);
  };

  const validateNumberOnly = (value: string): boolean => {
    return /^\d+$/.test(value);
  };

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    return /^\d{10}$/.test(phone);
  };

  const validateRegistrationNumber = (regNum: string): boolean => {
    return /^[A-Z]{3}\d{4}\d{3}$/.test(regNum) || regNum.length >= 5;
  };

  // Handle text input validation
  const handleTextInput = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const value = e.target.value;
    
    // Update form data
    setFormData(prev => ({ ...prev, [fieldName]: value }));

    // Allow empty input for partial typing
    if (value === '') {
      setValidationErrors(prev => ({ ...prev, [fieldName]: '' }));
      return;
    }

    if (!validateTextOnly(value)) {
      setValidationErrors(prev => ({ 
        ...prev, 
        [fieldName]: 'Only letters and spaces are allowed' 
      }));
    } else {
      setValidationErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  // Handle number input validation
  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const value = e.target.value;
    
    // Update form data
    setFormData(prev => ({ ...prev, [fieldName]: value }));

    // Allow empty input
    if (value === '') {
      setValidationErrors(prev => ({ ...prev, [fieldName]: '' }));
      return;
    }

    // Check if input contains only numbers
    if (!validateNumberOnly(value)) {
      setValidationErrors(prev => ({ 
        ...prev, 
        [fieldName]: 'Only numbers are allowed' 
      }));
      return;
    }

    if (fieldName === 'phone') {
      if (value.length > 10) {
        setValidationErrors(prev => ({ 
          ...prev, 
          [fieldName]: 'Phone number cannot exceed 10 digits' 
        }));
      } else if (value.length < 10 && value.length > 0) {
        setValidationErrors(prev => ({ 
          ...prev, 
          [fieldName]: 'Phone number must be exactly 10 digits' 
        }));
      } else if (value.length === 10) {
        setValidationErrors(prev => ({ ...prev, [fieldName]: '' }));
      }
    }
  };

  // Handle email validation
  const handleEmailInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Update form data
    setFormData(prev => ({ ...prev, email: value }));

    if (value === '') {
      setValidationErrors(prev => ({ ...prev, email: '' }));
      return;
    }

    if (!validateEmail(value)) {
      setValidationErrors(prev => ({ 
        ...prev, 
        email: 'Please enter a valid email address' 
      }));
    } else {
      setValidationErrors(prev => ({ ...prev, email: '' }));
    }
  };

  // Handle registration number validation
  const handleRegistrationInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Update form data
    setFormData(prev => ({ ...prev, registration_number: value }));

    if (value === '') {
      setValidationErrors(prev => ({ ...prev, registration_number: '' }));
      return;
    }

    if (!validateRegistrationNumber(value)) {
      setValidationErrors(prev => ({ 
        ...prev, 
        registration_number: 'Please enter a valid registration number (min 5 characters)' 
      }));
    } else {
      setValidationErrors(prev => ({ ...prev, registration_number: '' }));
    }
  };

  // Handle generic form field changes
  const handleFormFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Prevent invalid input in number fields
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, type: 'text' | 'number') => {
    if (type === 'number') {
      // Allow only numbers, backspace, delete, tab, escape, enter, arrows
      if (!/[0-9]/.test(e.key) && 
          !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
    } else if (type === 'text') {
      // Allow only letters, spaces, backspace, delete, tab, escape, enter, arrows
      if (!/[a-zA-Z\s]/.test(e.key) && 
          !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
    }
  };

  // Validate all form fields before submission
  const validateAllFields = () => {
    const errors: {[key: string]: string} = {};

    // Validate text fields
    const textFields = ['student_name', 'father_name', 'mother_name'];
    textFields.forEach(field => {
      const value = formData[field as keyof typeof formData];
      if (value && !validateTextOnly(value)) {
        errors[field] = 'Only letters and spaces are allowed';
      }
    });

    // Validate email
    if (formData.email && !validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Validate phone
    if (formData.phone) {
      if (!validateNumberOnly(formData.phone)) {
        errors.phone = 'Only numbers are allowed';
      } else if (formData.phone.length !== 10) {
        errors.phone = 'Phone number must be exactly 10 digits';
      }
    }

    // Validate registration number
    if (formData.registration_number && !validateRegistrationNumber(formData.registration_number)) {
      errors.registration_number = 'Please enter a valid registration number (min 5 characters)';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Fetch classes from backend
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoadingClasses(true);
        setClassError('');
        
        // Get token from localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          setClassError('Authentication token not found');
          toast.error('Authentication token not found');
          setLoadingClasses(false);
          return;
        }
        
        const response = await fetch(`${baseUrl}/api/classes`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch classes: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Classes data received:', data);
        
        const uniqueClassesMap = new Map();
        (data.data || data).forEach((cls: ClassData) => {
          if (!uniqueClassesMap.has(cls.class_name)) {
            uniqueClassesMap.set(cls.class_name, cls);
          }
        });
        setClasses(Array.from(uniqueClassesMap.values()));
        
        // Extract unique sections from all classes
        const uniqueSections = Array.from(new Set(data.map((cls: ClassData) => cls.section))) as string[];
        setSections(uniqueSections);
        
        toast.success('Classes loaded successfully');
      } catch (err) {
        console.error('Error fetching classes:', err);
        setClassError('Failed to load classes. Please try again.');
        toast.error('Failed to load classes. Please try again.');
      } finally {
        setLoadingClasses(false);
      }
    };
    
    fetchClasses();
  }, []);
  
  // Update available sections when a class is selected
  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedClassName = e.target.value;
    setSelectedClass(selectedClassName);
    
    // Update form data
    setFormData(prev => ({ ...prev, assigned_class: selectedClassName, assigned_section: '' }));
    
    // Filter sections based on the selected class
    if (selectedClassName) {
      const classData = classes.filter(cls => cls.class_name === selectedClassName);
      const availableSections = classData.map(cls => cls.section);
      setAvailableSections(availableSections);
    } else {
      setAvailableSections([]);
    }
  };

  const birthCertInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>, 
    setFileName: (name: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        e.target.value = '';
        return;
      }
      setFileName(file.name);
      toast.success(`File "${file.name}" selected successfully`);
    }
  };

  const handleRemoveBirthCert = () => {
    setBirthCertFileName('');
    if (birthCertInputRef.current) {
      birthCertInputRef.current.value = '';
    }
    toast.info('Birth certificate removed');
  };

  const handleRemovePhoto = () => {
    setPhotoFileName('');
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
    toast.info('Student photo removed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    if (!validateAllFields()) {
      toast.error('Please fix all validation errors before submitting');
      return;
    }

    // Check for validation errors
    const hasValidationErrors = Object.values(validationErrors).some(error => error !== '');
    if (hasValidationErrors) {
      toast.error('Please fix all validation errors before submitting');
      return;
    }

    // Validate required fields
    const submitFormData = new FormData(e.target as HTMLFormElement);
    const studentPhoto = submitFormData.get('student_photo') as File;
    const birthCertificate = submitFormData.get('birth_certificate') as File;

    if (!studentPhoto || !birthCertificate) {
      toast.error('Both student photo and birth certificate are required');
      return;
    }

    if (!user?.email) {
      toast.error('You must be logged in to register a student');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Get the authentication token without Bearer prefix (backend will handle this)
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Show loading toast
      const loadingToast = toast.loading('Registering student...');

      // Send form data to the backend
      const response = await fetch(`${baseUrl}/api/registerstudent`, {
        method: 'POST',
        body: submitFormData,
        headers: {
          'Authorization': token // Send token without Bearer prefix
        }
      });

      const result = await response.json();

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (!response.ok) {
        throw new Error(result.message || 'Failed to register student');
      }

      // Show success message
      toast.success('Student registered successfully! Redirecting to dashboard...');
      
      // Reset the form
      (e.target as HTMLFormElement).reset();
      setBirthCertFileName('');
      setPhotoFileName('');
      setValidationErrors({});
      setFormData({
        student_name: '',
        registration_number: '',
        date_of_birth: '',
        gender: '',
        address: '',
        assigned_class: '',
        assigned_section: '',
        father_name: '',
        mother_name: '',
        email: '',
        phone: ''
      });
      setSelectedClass('');
      setAvailableSections([]);

      // Redirect after a short delay to show success message
      setTimeout(() => {
        router.push('/principledashboard');
      }, 2000);

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to register student. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Required field indicator component
  const RequiredField = () => (
    <span className="text-red-500 ml-1">*</span>
  );

  // Validation error component
  const ValidationError = ({ error }: { error: string }) => (
    error ? <p className="text-red-500 text-xs mt-1">{error}</p> : null
  );

  return (
    <DashboardLayout>
      <div className="flex-1 bg-gray-50 overflow-auto">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="mb-8">
              <p className="text-3xl font-bold text-gray-900">Student Registration Portal</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="bg-white rounded-lg shadow-lg">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-lg">
                  <h2 className="text-2xl font-bold text-center text-white">New Student Registration</h2>
                </div>

                <div className="p-6">
                  {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md mb-4">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  <p className="text-sm text-red-500 mb-4">Fields marked with an asterisk (*) are mandatory</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Student Info */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg text-gray-700 border-b pb-2">Student Information</h3>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Student Name<RequiredField />
                        </label>
                        <input 
                          type="text"
                          name="student_name"
                          value={formData.student_name}
                          required
                          className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${validationErrors.student_name ? 'border-red-500' : 'border-gray-300'}`}
                          placeholder="Enter student's full name"
                          onChange={(e) => handleTextInput(e, 'student_name')}
                          onKeyPress={(e) => handleKeyPress(e, 'text')}
                        />
                        <ValidationError error={validationErrors.student_name} />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Registration Number<RequiredField />
                        </label>
                        <input 
                          type="text"
                          name="registration_number"
                          value={formData.registration_number}
                          required
                          className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${validationErrors.registration_number ? 'border-red-500' : 'border-gray-300'}`}
                          placeholder="e.g., REG2024001"
                          onChange={handleRegistrationInput}
                        />
                        <ValidationError error={validationErrors.registration_number} />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Date of Birth<RequiredField />
                        </label>
                        <input 
                          type="date"
                          name="date_of_birth"
                          value={formData.date_of_birth}
                          required
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          onChange={handleFormFieldChange}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Gender<RequiredField />
                        </label>
                        <select 
                          name="gender"
                          value={formData.gender}
                          required
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          onChange={handleFormFieldChange}
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Address<RequiredField />
                        </label>
                        <textarea 
                          name="address"
                          value={formData.address}
                          required
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={3}
                          placeholder="Enter full address"
                          onChange={handleFormFieldChange}
                        />
                      </div>

                      <h3 className="font-semibold text-lg text-gray-700 border-b pb-2 mt-6">Class & Section</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Assigned Class<RequiredField />
                          </label>
                          <select 
                            name="assigned_class"
                            required
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            onChange={handleClassChange}
                            value={selectedClass}
                            disabled={loadingClasses}
                          >
                            <option value="">{loadingClasses ? "Loading classes..." : "Select Class"}</option>
                            {classes.map((cls) => (
                              <option key={cls.id} value={cls.class_name}>{cls.class_name}</option>
                            ))}
                          </select>
                          {classError && <p className="text-red-500 text-xs mt-1">{classError}</p>}
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Section<RequiredField />
                          </label>
                          <select 
                            name="assigned_section"
                            value={formData.assigned_section}
                            required
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={!selectedClass || loadingClasses}
                            onChange={handleFormFieldChange}
                          >
                            <option value="">{!selectedClass ? "Select Class First" : "Select Section"}</option>
                            {selectedClass ? (
                              availableSections.length > 0 ? (
                                availableSections.map((section) => (
                                  <option key={section} value={section}>{section}</option>
                                ))
                              ) : (
                                <option value="" disabled>No sections available for this class</option>
                              )
                            ) : null}
                          </select>
                          {selectedClass && availableSections.length === 0 && !loadingClasses && (
                            <p className="text-yellow-500 text-xs mt-1">No sections found for this class</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Parent Info */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg text-gray-700 border-b pb-2">Parent Information</h3>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Father's Name<RequiredField />
                        </label>
                        <input 
                          type="text"
                          name="father_name"
                          value={formData.father_name}
                          required
                          className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${validationErrors.father_name ? 'border-red-500' : 'border-gray-300'}`}
                          placeholder="Enter father's full name"
                          onChange={(e) => handleTextInput(e, 'father_name')}
                          onKeyPress={(e) => handleKeyPress(e, 'text')}
                        />
                        <ValidationError error={validationErrors.father_name} />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Mother's Name<RequiredField />
                        </label>
                        <input 
                          type="text"
                          name="mother_name"
                          value={formData.mother_name}
                          required
                          className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${validationErrors.mother_name ? 'border-red-500' : 'border-gray-300'}`}
                          placeholder="Enter mother's full name"
                          onChange={(e) => handleTextInput(e, 'mother_name')}
                          onKeyPress={(e) => handleKeyPress(e, 'text')}
                        />
                        <ValidationError error={validationErrors.mother_name} />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Parent Email<RequiredField />
                        </label>
                        <input 
                          type="email"
                          name="email"
                          value={formData.email}
                          required
                          className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${validationErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                          placeholder="Enter parent's email"
                          onChange={handleEmailInput}
                        />
                        <ValidationError error={validationErrors.email} />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Phone<RequiredField />
                        </label>
                        <input 
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          required
                          maxLength={10}
                          className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${validationErrors.phone ? 'border-red-500' : 'border-gray-300'}`}
                          placeholder="Enter 10-digit contact number"
                          onChange={(e) => handleNumberInput(e, 'phone')}
                          onKeyPress={(e) => handleKeyPress(e, 'number')}
                        />
                        <ValidationError error={validationErrors.phone} />
                      </div>

                      <h3 className="font-semibold text-lg text-gray-700 border-b pb-2 mt-6">Student Documents</h3>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Birth Certificate<RequiredField />
                        </label>
                        <input 
                          ref={birthCertInputRef}
                          type="file"
                          name="birth_certificate"
                          required
                          onChange={(e) => handleFileChange(e, setBirthCertFileName)}
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {birthCertFileName && (
                          <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-sm text-green-700">✓ Selected: {birthCertFileName}</p>
                            <button 
                              type="button" 
                              onClick={handleRemoveBirthCert} 
                              className="text-sm text-red-500 hover:text-red-700 mt-1"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Student Photo<RequiredField />
                        </label>
                        <input 
                          ref={photoInputRef}
                          type="file"
                          name="student_photo"
                          required
                          onChange={(e) => handleFileChange(e, setPhotoFileName)}
                          accept="image/*"
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {photoFileName && (
                          <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-sm text-green-700">✓ Selected: {photoFileName}</p>
                            <button 
                              type="button" 
                              onClick={handleRemovePhoto} 
                              className="text-sm text-red-500 hover:text-red-700 mt-1"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <button 
                      type="submit"
                      disabled={isSubmitting || Object.values(validationErrors).some(error => error !== '')}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {isSubmitting ? 'Registering...' : 'Register Student'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
export default PreviewPage;