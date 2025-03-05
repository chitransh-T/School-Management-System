'use client'
import React, { useState } from 'react';
import Sidebar from '@/app/dashboardComponents/sidebar';
import { useRouter } from 'next/navigation';
import { FaEdit, FaTrash } from 'react-icons/fa';
import Link from 'next/link';

interface Student {
  id: number;
  name: string;
  rollNo: string;
  class: string;
  section: string;
  contactNo: string;
  email: string;
  address: string;
}

const StudentDetails = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  // Dummy student data
  const students = [
    {
      id: 1,
      name: "John Doe",
      rollNo: "2024001",
      class: "10th",
      section: "A",
      contactNo: "+1 234-567-8900",
      email: "john.doe@example.com",
      address: "123 School Street, City"
    },
    {
      id: 2,
      name: "Jane Smith",
      rollNo: "2024002",
      class: "10th",
      section: "B",
      contactNo: "+1 234-567-8901",
      email: "jane.smith@example.com",
      address: "456 Education Ave, City"
    }
    
  ];

  // Filter students based on search term
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <p className="text-gray-600 mt-1">Total Students: {students.length}</p>
          </div>
          
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
            {filteredStudents.map((student: Student) => (
              <div key={student.id} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 relative">
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

                {/* Existing student card content */}
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                    <span className="text-xl font-bold text-gray-600">
                      {student.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{student.name}</h3>
                    <p className="text-gray-500">Roll No: {student.rollNo}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Class: {student.class} | Section: {student.section}</p>
                  <p>Contact: {student.contactNo}</p>
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