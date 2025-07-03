"use client";
import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '@/app/dashboardComponents/sidebar';
import { useAuth } from '@/app/context/AuthContext';
import { fetchWithAuth } from '@/app/utils/api';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
import { useRouter } from 'next/navigation';
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
        
        // Set the classes
        // setClasses(data as ClassData[]);

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
      } catch (err) {
        console.error('Error fetching classes:', err);
        setClassError('Failed to load classes. Please try again.');
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
      setFileName(file.name);
    }
  };

  const handleRemoveBirthCert = () => {
    setBirthCertFileName('');
    if (birthCertInputRef.current) {
      birthCertInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFileName('');
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const formData = new FormData(e.target as HTMLFormElement);
    const studentPhoto = formData.get('student_photo') as File;
    const birthCertificate = formData.get('birth_certificate') as File;

    if (!studentPhoto || !birthCertificate) {
      setError('Both student photo and birth certificate are required.');
      return;
    }

    if (!user?.email) {
      setError('You must be logged in to register a student.');
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

      // Send form data to the backend
      const response = await fetch(`${baseUrl}/api/registerstudent`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': token // Send token without Bearer prefix
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to register student');
      }

      router.push('/principledashboard');
      // Reset the form
      (e.target as HTMLFormElement).reset();
      setBirthCertFileName('');
      setPhotoFileName('');
    } catch (err: any) {
      setError(err.message || 'Failed to register student. Please try again.');
      console.error('Error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Required field indicator component
  const RequiredField = () => (
    <span className="text-red-500 ml-1">*</span>
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
                          required
                          className="w-full p-2 border rounded-md"
                          placeholder="Enter student's full name"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Registration Number<RequiredField />
                        </label>
                        <input 
                          type="text"
                          name="registration_number"
                          required
                          className="w-full p-2 border rounded-md"
                          placeholder="e.g., REG2024001"
                        />
                      </div>

                      <div className="space-y-2 text-gray-500">
                        <label className="block text-sm font-medium text-gray-700">
                          Date of Birth<RequiredField />
                        </label>
                        <input 
                          type="date"
                          name="date_of_birth"
                          required
                          className="w-full p-2 border rounded-md"
                        />
                      </div>

                      <div className="space-y-2 text-gray-500">
                        <label className="block text-sm font-medium text-gray-700">
                          Gender<RequiredField />
                        </label>
                        <select 
                          name="gender"
                          required
                          className="w-full p-2 border rounded-md"
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
                          required
                          className="w-full p-2 border rounded-md"
                          rows={3}
                          placeholder="Enter full address"
                        />
                      </div>

                      <h3 className="font-semibold text-lg text-gray-700 border-b pb-2 mt-6">Class & Section</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 text-gray-500">
                          <label className="block text-sm font-medium text-gray-700">
                            Assigned Class<RequiredField />
                          </label>
                          <select 
                            name="assigned_class"
                            required
                            className="w-full p-2 border rounded-md"
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

                        <div className="space-y-2 text-gray-500">
                          <label className="block text-sm font-medium text-gray-700">
                            Section<RequiredField />
                          </label>
                          <select 
                            name="assigned_section"
                            required
                            className="w-full p-2 border rounded-md"
                            disabled={!selectedClass || loadingClasses}
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
                          required
                          className="w-full p-2 border rounded-md"
                          placeholder="Enter father's full name"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Mother's Name<RequiredField />
                        </label>
                        <input 
                          type="text"
                          name="mother_name"
                          required
                          className="w-full p-2 border rounded-md"
                          placeholder="Enter mother's full name"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Parent Email<RequiredField />
                        </label>
                        <input 
                          type="email"
                          name="email"
                          required
                          className="w-full p-2 border rounded-md"
                          placeholder="Enter parent's email"
                        />
                      </div>
                      

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Phone<RequiredField />
                        </label>
                        <input 
                          type="tel"
                          name="phone"
                          required
                          className="w-full p-2 border rounded-md"
                          placeholder="Enter contact number"
                        />
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
                          className="w-full p-2 border rounded-md"
                        />
                        {birthCertFileName && (
                          <div className="mt-1">
                            <p className="text-sm text-gray-500">Selected: {birthCertFileName}</p>
                            <button onClick={handleRemoveBirthCert} className="text-sm text-red-500 hover:text-red-700">Remove</button>
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
                          className="w-full p-2 border rounded-md"
                        />
                        {photoFileName && (
                          <div className="mt-1">
                            <p className="text-sm text-gray-500">Selected: {photoFileName}</p>
                            <button onClick={handleRemovePhoto} className="text-sm text-red-500 hover:text-red-700">Remove</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
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