'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, UserIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
import { useRouter } from 'next/navigation';
// Types
interface ClassData {
  id?: number;
  class_name: string;
  section: string;
}

interface Student {
  id: string;
  name: string;
  registrationNumber: string;
  className: string;
  assignedSection: string;
  studentPhoto: string;
  admissionDate: Date;
  username: string;
  password: string;
}

// Custom Select Component
interface SelectProps {
  value: string | null;
  onValueChange: (value: string | null) => void;
  placeholder: string;
  options: Array<{ value: string | null; label: string }>;
  disabled?: boolean;
}

const Select: React.FC<SelectProps> = ({ 
  value, 
  onValueChange, 
  placeholder, 
  options, 
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(option => option.value === value);

  return (
   
    <div className="relative">
      <button
        type="button"
        className={`w-full px-3 py-2 text-left bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className={selectedOption ? 'text-blue-900' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </button>
      
      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.map((option, index) => (
            <button
              key={index}
              type="button"
              className={`w-full px-3 py-2 text-left hover:bg-blue-50 focus:outline-none focus:bg-blue-50 ${
                option.value === value ? 'bg-blue-100 text-blue-900' : 'text-gray-700'
              }`}
              onClick={() => {
                onValueChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Main Component
const StudentAdmissionPage: React.FC = () => {
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Class and section states similar to mark attendance page
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [classError, setClassError] = useState('');
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [availableSections, setAvailableSections] = useState<string[]>([]);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    setToken(storedToken);
    
    if (storedToken) {
      fetchClasses();
    }
  }, []);

  // Fetch classes from the backend - similar to mark attendance page
  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      setClassError('');
      setError(null);
      
      // Get token from localStorage
      const storedToken = token || localStorage.getItem('token');
      
      if (!storedToken) {
        setClassError('Authentication token not found');
        setLoadingClasses(false);
        return;
      }
      
      const response = await fetch(`${baseUrl}/api/classes`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${storedToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch classes: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Classes data received:', data);
      
      // Set the classes
      setClasses(data);
      
      // Extract unique class names
      const uniqueClasses = Array.from(new Set(data.map((cls: ClassData) => cls.class_name))) as string[];
      setAvailableClasses(uniqueClasses);
      
      // Extract unique sections from all classes
      const uniqueSections = Array.from(new Set(data.map((cls: ClassData) => cls.section))) as string[];
      setAvailableSections(uniqueSections);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setClassError('Failed to load classes. Please try again.');
      setError(`Error loading classes: ${err}`);
    } finally {
      setLoadingClasses(false);
    }
  };

  // Update available sections when a class is selected - similar to mark attendance page
  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedClassName = e.target.value;
    setSelectedClass(selectedClassName);
    
    // Filter sections based on the selected class
    if (selectedClassName) {
      const classData = classes.filter(cls => cls.class_name === selectedClassName);
      const sections = classData.map(cls => cls.section);
      setAvailableSections(sections);
      
      // If there are students loaded, filter them
      filterStudents(selectedClassName, selectedSection);
      
      // Fetch students for this class
      fetchStudentsByClass(selectedClassName);
    } else {
      // If no class is selected, show all available sections
      const allSections = Array.from(new Set(classes.map(cls => cls.section))) as string[];
      setAvailableSections(allSections);
      setStudents([]);
      setFilteredStudents([]);
    }
  };
  
  // Handle section change
  const handleSectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSection = e.target.value;
    setSelectedSection(newSection);
    filterStudents(selectedClass, newSection);
  };

  const fetchStudentsByClass = async (className: string) => {
    if (!token || !className) return;

    setIsLoadingStudents(true);
    setStudents([]);
    setFilteredStudents([]);
    setError(null);

    try {
      const response = await fetch(
        `${baseUrl}/api/students?class=${encodeURIComponent(className)}`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const studentData = await response.json();
        const studentsWithData: Student[] = studentData
          .map((data: any) => ({
            id: data._id?.toString() || data.id?.toString() || '',
            name: data.student_name?.toString() || 'Unknown Student',
            registrationNumber: data.registration_number?.toString() || 'N/A',
            className: data.assigned_class || className,
            assignedSection: data.assigned_section?.toString() || 'N/A',
            studentPhoto: data.student_photo?.toString() || '',
            admissionDate: data.created_at ? new Date(data.created_at) : new Date(),
            username: data.username?.toString() || 'N/A',
            password: data.password?.toString() || 'N/A',
          }))
          .filter((student: Student) => student.id);

        setStudents(studentsWithData);
        filterStudents(className, selectedSection, studentsWithData);
      } else {
        setError(`Failed to load students: ${response.status}`);
      }
    } catch (error) {
      setError(`Error loading students: ${error}`);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const filterStudents = (className: string = selectedClass, section: string = selectedSection, studentList: Student[] = students) => {
    const filtered = studentList.filter(student => {
      const classMatch = !className || student.className.toLowerCase() === className.toLowerCase();
      const sectionMatch = !section || student.assignedSection.toLowerCase() === section.toLowerCase();
      return classMatch && sectionMatch;
    });
    setFilteredStudents(filtered);
  };

  useEffect(() => {
    filterStudents(selectedClass, selectedSection);
  }, [selectedSection, students]);

  const viewAdmissionConfirmation = (student: Student) => {
    console.log('Navigate to admission confirmation for:', student);
    
    // Store student data in localStorage for the admission letter page to access
    localStorage.setItem('selectedStudent', JSON.stringify(student));
    
    // Navigate to the admission letter page
    router.push('/Admissionletter');
  };

  const buildStudentPhoto = (photoPath: string) => {
    if (!photoPath) {
      return (
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <UserIcon className="h-6 w-6 text-blue-800" />
        </div>
      );
    }

    const fullPhotoPath = photoPath.startsWith('http') 
      ? photoPath 
      : `${baseUrl}/uploads/${photoPath}`;

    return (
      <div className="w-12 h-12 rounded-full overflow-hidden">
        <img
          src={fullPhotoPath}
          alt="Student"
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.parentElement!.innerHTML = `
              <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg class="h-6 w-6 text-red-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            `;
          }}
        />
      </div>
    );
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="bg-blue-800 text-white py-4 px-6">
        <h1 className="text-xl font-semibold text-center">Admission Letters</h1>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Filter Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-blue-800 mb-4">Filter Students</h2>
          
          {/* Class and Section Filters in the same line */}
          <div className="flex flex-row space-x-4">
            {/* Class Dropdown */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-blue-800 mb-2">Class</label>
              {loadingClasses ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-sm text-gray-500">Loading classes...</span>
                </div>
              ) : (
                <select
                  value={selectedClass}
                  onChange={handleClassChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Select a Class --</option>
                  {availableClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              )}
              {classError && <p className="text-red-500 text-xs mt-1">{classError}</p>}
            </div>

            {/* Section Dropdown */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-blue-800 mb-2">Section</label>
              {loadingClasses ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-sm text-gray-500">Loading sections...</span>
                </div>
              ) : (
                <select
                  value={selectedSection}
                  onChange={handleSectionChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!selectedClass}
                >
                  <option value="">-- All Sections --</option>
                  {availableSections.map((section) => (
                    <option key={section} value={section}>
                      {typeof section === 'string' && section.length === 1 ? section.toUpperCase() : section}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Student List */}
        <div className="bg-white rounded-xl shadow-md">
          {isLoadingStudents ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800"></div>
            </div>
          ) : !selectedClass ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <UserIcon className="h-12 w-12 text-blue-800 mb-4" />
              <p className="text-lg text-blue-900">Please select a class to view students</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              {selectedSection ? (
                <UserIcon className="h-12 w-12 text-blue-800 mb-4" />
              ) : (
                <UserIcon className="h-12 w-12 text-blue-800 mb-4" />
              )}
              <p className="text-lg text-blue-900">
                {selectedSection 
                  ? 'No students found in this section'
                  : 'No students found in this class'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                  onClick={() => viewAdmissionConfirmation(student)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {buildStudentPhoto(student.studentPhoto)}
                      <div>
                        <h3 className="text-lg font-bold text-blue-900">{student.name}</h3>
                        <p className="text-blue-800">Reg: {student.registrationNumber}</p>
                        <p className="text-blue-800">
                          Class: {student.className} • Section: {student.assignedSection}
                        </p>
                      </div>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-full">
                      <ArrowRightIcon className="h-5 w-5 text-blue-800" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentAdmissionPage;