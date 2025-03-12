'use client';
import React, { useState, useEffect } from 'react';
import Sidebar from '@/app/dashboardComponents/sidebar';
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

const StudentDetails = () => {
  const router = useRouter();
  const { user } = useAuth(); // Get current admin's data
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Add state for class and section filters
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  // Define fixed section options
  const fixedSections = ['A', 'B', 'C'];

  // Fetch student data from the API
  useEffect(() => {
    const fetchStudents = async () => {
      if (!user?.id) {
        setError('You must be logged in to view students.');
        setLoading(false);
        return;
      }

      try {
        // Build query parameters including class and section filters
        let url = `http://localhost:1000/students?admin_id=${user.id}`;
        if (selectedClass) {
          url += `&class=${encodeURIComponent(selectedClass)}`;
        }
        if (selectedSection) {
          url += `&section=${encodeURIComponent(selectedSection)}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setStudents(data);

        // Extract unique classes and sections for filters
        if (!selectedClass && !selectedSection) {
          const classes = [...new Set(data.map((student: Student) => student.assigned_class))].filter(Boolean) as string[];
          setAvailableClasses(classes);
        }
      } catch (err) {
        setError('Failed to load student data. Please try again later.');
        console.error('Error fetching students:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [user?.id, selectedClass, selectedSection]); // Re-fetch when filters change

  // Reset section when class changes
  useEffect(() => {
    if (selectedClass) {
      // We're no longer filtering sections based on class since we're using fixed sections
    }
    setSelectedSection('');
  }, [selectedClass]);

  // Filter students based on search term
  const filteredStudents = students.filter(
    (student) =>
      student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.registration_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (studentId: number) => {
    if (!user?.id) {
      setError('You must be logged in to delete students.');
      return;
    }
  
    if (!confirm('Are you sure you want to delete this student?')) {
      return;
    }
  
    try {
      // Since admin_id doesn't exist in the database, let's try deleting without it
      const url = `http://localhost:1000/students/${studentId}`;
      console.log('Delete request URL:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete student');
        } catch (parseError) {
          throw new Error('Failed to delete student');
        }
      }
  
      setSuccess('Student deleted successfully');
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
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-6 max-w-6xl mx-auto my-12">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-6 max-w-6xl mx-auto my-12">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }
  const handleAddStudent = () => {
    router.push('/addstudent');
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6 max-w-6xl mx-auto my-12">
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
              onChange={(e) => setSelectedClass(e.target.value)}
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
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              disabled={!selectedClass} // Only enable if class is selected
            >
              <option value="">All Sections</option>
              {fixedSections.map((section) => (
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
                    href={`/editstudent/${student.id}`}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
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
                        src={`http://localhost:1000/uploads/${student.student_photo}`}
                        alt={student.student_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-bold text-gray-600">
                        {student.student_name.charAt(0)}
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
    </div>
  );
};

export default StudentDetails;

