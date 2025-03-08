'use client';
import React, { useState, useEffect } from 'react';
import Sidebar from '@/app/dashboardComponents/sidebar';
import { useRouter } from 'next/navigation';
import { FaEdit, FaTrash } from 'react-icons/fa';
import Link from 'next/link';

interface Student {
  id: number;
  student_name: string;
  registration_number: string;
  assigned_class: string;
  assigned_section: string;
  phone: string;
  email: string;
  address: string;
  student_photo: string;
  birth_certificate: string;
}

const StudentDetails = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch student data from the API
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch('http://localhost:1000/students');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched data:', data); // Debugging
        setStudents(data);
      } catch (err) {
        setError('Failed to load student data. Please try again later.');
        console.error('Error fetching students:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Filter students based on search term
  const filteredStudents = students.filter(
    (student) =>
      student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.registration_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddStudent = () => {
    router.push('/addstudent');
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

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6 max-w-6xl mx-auto my-12">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Student Details</h1>
            <p className="text-gray-600 mt-1">Total Students: {students.length}</p>
          </div>
          <button
            onClick={handleAddStudent}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Student
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6 text-gray-600">
          <input
            type="text"
            placeholder="Search by name or roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

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
                    onClick={async () => {
                      if (confirm('Are you sure you want to delete this student?')) {
                        // Add delete API call here
                        console.log('Delete student:', student.id);
                      }
                    }}
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