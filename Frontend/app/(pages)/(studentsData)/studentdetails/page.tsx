'use client';
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
import { useRouter } from 'next/navigation';
import { FaEdit, FaTrash, FaFilter } from 'react-icons/fa';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';

interface Student {
  id: number;
  address: string;
  student_name: string;
  registration_number: string;
  assigned_class: string;
  assigned_section: string;
  phone: string;
  email: string;
  student_photo: string;
  birth_certificate: string;
}

interface ClassData {
  id: number;
  class_name: string;
  section: string;
  tuition_fees: number;
  teacher_name: string;
  user_email: string;
}

const StudentDetails = () => {
  const router = useRouter();
  const { user } = useAuth(); // Get current admin's data
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [classError, setClassError] = useState('');
  // Add state for class and section filters
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);

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
      // If no class is selected, show all available sections
      const allSections = Array.from(new Set(classes.map(cls => cls.section))) as string[];
      setAvailableSections(allSections);
    }
  };
  
  const handleSectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSection(e.target.value);
  };
  // Fetch student data from the API
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        // Build query parameters for class and section filters
        let url = `${baseUrl}/api/students`;
        const params = new URLSearchParams();
        
        // We don't need to add admin_id as the backend uses the JWT token
        // to identify the user and return their students
        
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

        // Extract unique classes for filters
        if (!selectedClass && !selectedSection) {
          const classes = [...new Set(data.map((student: Student) => student.assigned_class))].filter(Boolean) as string[];
          setAvailableClasses(classes);
        }
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Failed to load student data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedClass, selectedSection, user?.id]); // Re-fetch when filters change or user changes

  // Reset section when class changes
  useEffect(() => {
    setSelectedSection('');
  }, [selectedClass]);

  // Add debugging logs for section values
  useEffect(() => {
    if (selectedSection) {
      console.log('Selected section:', selectedSection);
      console.log('Student sections:', students.map(s => ({ 
        name: s.student_name, 
        section: s.assigned_section,
        sectionType: typeof s.assigned_section
      })));
    }
  }, [selectedSection, students]);

  // Filter students based on search term, class, and section
  const filteredStudents = students.filter((student) => {
    // Search term filter
    const matchesSearch = 
      student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.registration_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Class filter
    const matchesClass = !selectedClass || 
      (student.assigned_class && student.assigned_class.toLowerCase() === selectedClass.toLowerCase());
    
    // Section filter - Fix: trim whitespace and handle case sensitivity
    const studentSection = student.assigned_section ? student.assigned_section.trim() : '';
    const selectedSectionValue = selectedSection ? selectedSection.trim() : '';
    
    // Log each comparison for debugging
    if (selectedSection && studentSection) {
      console.log(`Comparing: '${studentSection}' with '${selectedSectionValue}', equal: ${studentSection === selectedSectionValue}`);
    }
    
    const matchesSection = !selectedSection || studentSection === selectedSectionValue;
    
    return matchesSearch && matchesClass && matchesSection;
  });

  const handleDelete = async (studentId: number) => {
    if (!user?.id) {
      setError('You must be logged in to delete students.');
      return;
    }
  
    if (!confirm('Are you sure you want to delete this student?')) {
      return;
    }
  
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      const url = `${baseUrl}/api/students/${studentId}`;
      console.log('Attempting to delete student:', studentId);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      console.log('Delete response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to delete student');
      }

      setSuccess(data.message || 'Student deleted successfully');
      setError('');
      
      // Remove the deleted student from the state
      setStudents(students.filter(student => student.id !== studentId));

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Error deleting student:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete student');
      setSuccess('');
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
  const handleAddStudent = () => {
    router.push('/addstudent');
  };

  return (
    <DashboardLayout>
      <div className="w-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Student Details</h1>
            <p className="text-gray-600 mt-1">Total Students: {filteredStudents.length}</p>
          </div>
          <button
            onClick={handleAddStudent}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Student
          </button>
        </div>

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {/* Class and Section Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Class</label>
            <select
              value={selectedClass}
              onChange={handleClassChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="">All Classes</option>
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Section</label>
            <select
              value={selectedSection}
              onChange={handleSectionChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              disabled={!availableSections.length} // Only enable if sections are available
            >
              <option value="">All Sections</option>
              {availableSections.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
          </div>

          {/* Search Bar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by name or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>
        </div>

        {/* Reset Filters Button */}
        {(selectedClass || selectedSection || searchTerm) && (
          <div className="mb-4">
            <button
              onClick={() => {
                setSelectedClass('');
                setSelectedSection('');
                setSearchTerm('');
              }}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm flex items-center"
            >
              <FaFilter className="mr-1" /> Clear Filters
            </button>
          </div>
        )}

        {filteredStudents.length === 0 ? (
          <div>No students found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 relative"
              >
                {/* Action buttons */}
                <div className="absolute top-4 right-4 flex space-x-2">
                  <Link
                    href={`/editstudent?id=${student.id}`}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="Edit Student"
                  >
                    <FaEdit className="w-4 h-4" />
                  </Link>
                  <button
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    onClick={() => handleDelete(student.id)}
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>

                {/* Student card content */}
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                    {student.student_photo ? (
                      <img
                        src={`${baseUrl}/uploads/${student.student_photo}`}
                        alt={student.student_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-bold text-gray-600">
                        {student.student_name?.trim().charAt(0).toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {student.student_name}
                    </h3>
                    <p className="text-gray-500">Roll No: {student.registration_number}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    Class: {student.assigned_class} | Section: {student.assigned_section}
                  </p>
                  <p>Contact: {student.phone}</p>
                  <p>Email: {student.email}</p>
                  <p>Address: {student.address}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentDetails;

