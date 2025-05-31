"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { Search, School, Users, ArrowRight, User, Filter } from 'lucide-react';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
import { useRouter } from 'next/navigation';

// Types
interface ClassData {
  id: number;
  class_name: string;
  section: string;
  tuition_fees: number;
  teacher_name?: string;
  user_email?: string;
}

interface Student {
  id: number;
  student_name: string;
  registration_number: string;
  assigned_class: string;
  assigned_section: string;
  student_photo: string;
  address?: string;
  phone?: string;
  email?: string;
  birth_certificate?: string;
}

const FeesStudentSearchPage: React.FC = () => {
  // Initialize router
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [classError, setClassError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch classes when component mounts
  useEffect(() => {
    fetchClasses();
  }, []);

  // Filter students based on search, class, and section
  useEffect(() => {
    const searchText = searchQuery.toLowerCase();
    const filtered = students.filter((student) => {
      // Filter by search query
      const matchesSearch = student.student_name.toLowerCase().includes(searchText) || 
                          student.registration_number.toLowerCase().includes(searchText);
      
      // Filter by class if selected
      const matchesClass = !selectedClass || 
                         student.assigned_class.toLowerCase() === selectedClass.toLowerCase();
      
      // Filter by section if selected
      const matchesSection = !selectedSection || 
                           student.assigned_section.toLowerCase() === selectedSection.toLowerCase();
      
      // Return true only if all conditions are met
      return matchesSearch && matchesClass && matchesSection;
    });
    
    console.log('Filtered students:', filtered);
    console.log('Filter criteria - Class:', selectedClass, 'Section:', selectedSection);
    setFilteredStudents(filtered);
  }, [students, searchQuery, selectedClass, selectedSection]);

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
    } finally {
      setLoadingClasses(false);
    }
  };

  // Fetch student data from the API when class or section changes
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoadingStudents(true);
        setFilteredStudents([]);
        setError(null);
        
        // Build query parameters for class and section filters
        let url = `${baseUrl}/api/students`;
        const params = new URLSearchParams();
        
        if (selectedClass) {
          params.append('class', selectedClass);
        }
        if (selectedSection) {
          params.append('section', selectedSection);
        }

        // Add params to URL if any exist
        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        console.log('Fetching students from:', url);
        
        // Get the token from localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Authentication token not found');
        }
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched students:', data);
        
        // Check if the response is an array (as expected)
        if (Array.isArray(data)) {
          setStudents(data);
        } else {
          // If the API returns an object with a data property (common pattern)
          if (data.data && Array.isArray(data.data)) {
            setStudents(data.data);
          } else {
            console.error('Unexpected API response format:', data);
            setStudents([]);
          }
        }

        // Extract unique classes for filters if not already selected
        if (!selectedClass && !selectedSection) {
          const classes = [...new Set(data.map((student: Student) => student.assigned_class))].filter(Boolean) as string[];
          setAvailableClasses(classes);
        }
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Failed to load student data. Please try again later.');
      } finally {
        setIsLoadingStudents(false);
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedClass, selectedSection]); // Re-fetch when filters change

  // Reset section when class changes
  useEffect(() => {
    setSelectedSection('');
  }, [selectedClass]);

  // Handle class change - update available sections
  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedClassName = e.target.value;
    setSelectedClass(selectedClassName);
    
    // Filter sections based on the selected class
    if (selectedClassName) {
      const classData = classes.filter(cls => cls.class_name === selectedClassName);
      const availableSections = classData.map(cls => cls.section);
      setAvailableSections(availableSections);
    } else {
      // If no class is selected, show all available sections
      const allSections = Array.from(new Set(classes.map(cls => cls.section))) as string[];
      setAvailableSections(allSections);
    }
  };
  
  const handleSectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSection(e.target.value);
  };

  const openFeesCollectPage = (student: Student) => {
    // Find the class to get tuition fees
    const selectedClassData = classes.find(c => c.class_name === student.assigned_class);
    const monthlyFee = selectedClassData?.tuition_fees || 0;
    
    // Create query params for navigation
    const queryParams = new URLSearchParams({
      studentId: student.id.toString(),
      studentName: student.student_name,
      studentClass: student.assigned_class,
      studentSection: student.assigned_section,
      monthlyFee: monthlyFee.toString(),
      isNewAdmission: 'false'
    }).toString();
    
    // Navigate to fees details page with query parameters
    router.push(`/feesdetailsofstudent?${queryParams}`);
    
    console.log(`Navigating to fees collection for ${student.student_name}`);
  };

  const StudentPhoto: React.FC<{ photoPath: string }> = ({ photoPath }) => {
    if (!photoPath) {
      return (
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
          <User className="w-6 h-6 text-blue-800" />
        </div>
      );
    }
    
    const imageUrl = photoPath.startsWith('http') 
      ? photoPath 
      : `${baseUrl}/uploads/${photoPath}`;
    
    return (
      <img
        src={imageUrl}
        alt="Student"
        className="w-12 h-12 rounded-full object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.nextElementSibling?.classList.remove('hidden');
        }}
      />
    );
  };

  const ErrorAlert: React.FC = () => {
    if (!error) return null;
    
    return (
      <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
        {error}
        <button
          onClick={() => setError(null)}
          className="float-right text-red-500 hover:text-red-700"
        >
          ×
        </button>
      </div>
    );
  };

  return (
    <DashboardLayout>
      {/* Header with integrated filters */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white p-6 shadow-md">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Fees Collection</h1>
          
          {/* Class and Section Dropdowns directly below header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Class Dropdown */}
            <div>
              <label className="block text-sm font-medium text-white mb-1">Select Class</label>
              {loadingClasses ? (
                <div className="flex justify-center py-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                </div>
              ) : availableClasses.length === 0 ? (
                <div className="text-center py-2 text-white bg-blue-700 bg-opacity-50 rounded-lg">No classes available</div>
              ) : (
                <select
                  value={selectedClass}
                  onChange={handleClassChange}
                  className="w-full p-3 border border-blue-300 rounded-lg bg-blue-700 bg-opacity-30 text-white placeholder-blue-200 focus:ring-2 focus:ring-white focus:border-blue-300"
                >
                  <option value="" className="text-gray-800">-- Select a Class --</option>
                  {availableClasses.map((className) => (
                    <option key={className} value={className} className="text-gray-800">
                      {className}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Section Dropdown */}
            <div>
              <label className="block text-sm font-medium text-white mb-1">Select Section</label>
              <select
                value={selectedSection}
                onChange={handleSectionChange}
                className="w-full p-3 border border-blue-300 rounded-lg bg-blue-700 bg-opacity-30 text-white placeholder-blue-200 focus:ring-2 focus:ring-white focus:border-blue-300"
                disabled={!selectedClass}
              >
                <option value="" className="text-gray-800">-- All Sections --</option>
                {availableSections.map((section) => (
                  <option key={section} value={section} className="text-gray-800">
                    {section}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto">
        <ErrorAlert />

        {/* Search Field */}
        {selectedClass && (
          <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-800" />
              <input
                type="text"
                placeholder="Search Student"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-none rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Students Section */}
        {selectedClass && (
          <div className="mb-4">
            <h3 className="text-lg font-bold text-blue-900 mb-2">Students</h3>
          </div>
        )}

        {/* Content Area */}
        <div className="min-h-96">
          {isLoadingStudents ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800"></div>
            </div>
          ) : !selectedClass ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <School className="w-12 h-12 text-blue-800 mb-4" />
              <p className="text-lg text-gray-800">Please select a class to view students</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Users className="w-12 h-12 text-blue-800 mb-4" />
              <p className="text-lg text-gray-800">
                {selectedSection 
                  ? 'No students found in this section'
                  : 'No students found in this class'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => openFeesCollectPage(student)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <StudentPhoto photoPath={student.student_photo} />
                      <div>
                        <h4 className="font-bold text-blue-900">{student.student_name}</h4>
                        <p className="text-sm text-gray-600">
                          Reg: {student.registration_number}
                        </p>
                        <p className="text-sm text-gray-600">
                          Class: {student.assigned_class} • Section: {student.assigned_section}
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                      <ArrowRight className="w-5 h-5 text-blue-800" />
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

export default FeesStudentSearchPage;