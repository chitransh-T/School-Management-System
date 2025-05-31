'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/app/dashboardComponents/sidebar';
import { format } from 'date-fns';
import { useAuth } from '@/app/context/AuthContext';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
interface Student {
  id: number;
  student_name: string;
  registration_number: string;
  assigned_class: string;
  assigned_section: string;
}

interface ClassData {
  id?: number;
  class_name: string;
  section: string;
}

const MarkAttendance = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [attendance, setAttendance] = useState<{ [key: number]: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const [checkingExistingAttendance, setCheckingExistingAttendance] = useState(false);
  const [attendanceAlreadyMarked, setAttendanceAlreadyMarked] = useState(false);
  const [markedStudentIds, setMarkedStudentIds] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [classError, setClassError] = useState('');
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  // Fetch classes from the backend
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

  // Check if attendance has already been marked for the selected date, class, and section
  const checkExistingAttendance = async () => {
    if (!selectedDate || !selectedClass || !selectedSection) return;
    
    setCheckingExistingAttendance(true);
    setAttendanceAlreadyMarked(false);
    setMarkedStudentIds([]);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Fetch attendance records for the selected date and class
      const url = `${baseUrl}/api/attendance/${encodeURIComponent(selectedClass)}/${encodeURIComponent(selectedDate)}?section=${encodeURIComponent(selectedSection)}`;
      console.log('Checking existing attendance:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // If status is 404, it means no attendance records found, which is fine
      if (response.status === 404) {
        setAttendanceAlreadyMarked(false);
        return;
      }
      
      const data = await response.json();
      console.log('Existing attendance data:', data);
      
      // Check if there are any attendance records for the selected date
      if (data && data.students && Array.isArray(data.students) && data.students.length > 0) {
        // Get the IDs of students who already have attendance marked
        const markedIds = data.students.map((student: any) => student.id || student.student_id);
        setMarkedStudentIds(markedIds);
        
        if (markedIds.length > 0) {
          setAttendanceAlreadyMarked(true);
          setError(`Attendance for ${markedIds.length} student(s) has already been marked for this date.`);
        } else {
          setAttendanceAlreadyMarked(false);
        }
      } else {
        setAttendanceAlreadyMarked(false);
      }
    } catch (err) {
      console.error('Error checking existing attendance:', err);
      // If there's an error, we'll assume no attendance has been marked
      setAttendanceAlreadyMarked(false);
    } finally {
      setCheckingExistingAttendance(false);
    }
  };

  // Fetch students based on selected class and section
  const fetchStudents = async () => {
    if (!selectedClass || !selectedSection) {
      setStudents([]);
      return;
    }

    setFetchingStudents(true);
    setError('');
    
    console.log('Fetching students with params:', { selectedClass, selectedSection });
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Make sure we're using the correct query parameters based on your backend API
      // Some APIs might use class_name and section instead of class and section
      const url = `${baseUrl}/api/students?class=${encodeURIComponent(selectedClass)}&section=${encodeURIComponent(selectedSection)}`;
      console.log('Request URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch students');
      }

      if (Array.isArray(data) && data.length === 0) {
        setError('No students found for the selected class and section');
        setStudents([]);
      } else if (Array.isArray(data)) {
        // Filter students to ensure they match the selected class and section
        // This is a double check in case the API doesn't filter properly
        const filteredStudents = data.filter(student => 
          (student.assigned_class === selectedClass || 
           student.assigned_class?.toLowerCase() === selectedClass?.toLowerCase()) && 
          (student.assigned_section === selectedSection || 
           student.assigned_section?.toLowerCase() === selectedSection?.toLowerCase())
        );
        
        if (filteredStudents.length === 0) {
          setError('No students found for the selected class and section');
          setStudents([]);
        } else {
          setStudents(filteredStudents);
          // Initialize attendance for all students as "Present" (true)
          const initialAttendance: { [key: number]: boolean } = {};
          filteredStudents.forEach((student: Student) => {
            initialAttendance[student.id] = true;
          });
          setAttendance(initialAttendance);
          
          // Check if attendance has already been marked for these students on the selected date
          checkExistingAttendance();
        }
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err instanceof Error ? err.message : 'Failed to load students');
      setStudents([]);
    } finally {
      setFetchingStudents(false);
    }
  };



  // Fetch students when class and section are selected
  useEffect(() => {
    if (selectedClass && selectedSection) {
      console.log('Class or section changed:', { selectedClass, selectedSection });
      fetchStudents();
    } else {
      // Clear students when class or section is deselected
      setStudents([]);
      setAttendance({});
      setAttendanceAlreadyMarked(false);
      setMarkedStudentIds([]);
    }
  }, [selectedClass, selectedSection]);
  
  // Check for existing attendance when date changes
  useEffect(() => {
    if (selectedDate && selectedClass && selectedSection && students.length > 0) {
      checkExistingAttendance();
    }
  }, [selectedDate]);

  // Handle attendance checkbox change
  const handleAttendanceChange = (studentId: number, isPresent: boolean) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: isPresent,
    }));
  };

  // Submit attendance to the backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!user?.id) {
      setError('Authentication failed. Please try again.');
      setLoading(false);
      return;
    }
    
    // Check if attendance has already been marked for this date
    if (attendanceAlreadyMarked) {
      setError(`Attendance has already been marked for this class, section, and date. Please select a different date or update the existing attendance.`);
      setLoading(false);
      return;
    }

    try {
      // Check one more time for existing attendance to prevent race conditions
      await checkExistingAttendance();
      
      if (attendanceAlreadyMarked) {
        setError(`Attendance has already been marked for this class, section, and date. Please select a different date or update the existing attendance.`);
        setLoading(false);
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Format data according to the backend API expectations
      const studentsData = students.map((student) => ({
        student_id: student.id,
        is_present: attendance[student.id] ? 1 : 0,
        class_name: selectedClass
      }));

      const url = `${baseUrl}/api/attendance`;
      console.log('Request URL:', url);
      console.log('Request data:', { date: selectedDate, students: studentsData });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          date: selectedDate, 
          students: studentsData 
        }),
      });
      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        if (response.status === 409 || (data && data.message && data.message.includes('already marked'))) {
          setError('Attendance has already been marked for this date. Please select a different date.');
          setAttendanceAlreadyMarked(true);
        } else {
          throw new Error(data.message || 'Failed to submit attendance');
        }
      } else {
        setSuccess('Attendance marked successfully');

        // Clear form after successful submission
        setTimeout(() => {
          setSelectedClass('');
          setSelectedSection('');
          setStudents([]);
          setAttendance({});
          setSuccess('');
          setAttendanceAlreadyMarked(false);
          setMarkedStudentIds([]);
        }, 2000);
      }
    } catch (err) {
      console.error('Error submitting attendance:', err);
      setError('Failed to submit attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    
    <DashboardLayout>
      <div className="flex-1 p-6 max-w-6xl mx-auto my-12">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-700">Mark Attendance</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className={`w-full p-2 border rounded-md text-gray-700 ${attendanceAlreadyMarked ? 'border-yellow-500' : ''}`}
                    required
                  />
                  {checkingExistingAttendance && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
                {attendanceAlreadyMarked && (
                  <p className="text-yellow-600 text-xs mt-1">
                    Attendance already marked for this date
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class
                </label>
                {loadingClasses ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-sm text-gray-500">Loading classes...</span>
                  </div>
                ) : (
                  <select
                    value={selectedClass}
                    onChange={handleClassChange}
                    className="w-full p-2 border rounded-md text-gray-700"
                    required
                  >
                    <option value="">Select Class</option>
                    {availableClasses.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section
                </label>
                {loadingClasses ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-sm text-gray-500">Loading sections...</span>
                  </div>
                ) : (
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full p-2 border rounded-md text-gray-700"
                    required
                  >
                    <option value="">Select Section</option>
                    {availableSections.map((section) => (
                      <option key={section} value={section}>
                        {typeof section === 'string' && section.length === 1 ? section.toUpperCase() : section}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {fetchingStudents ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : students.length > 0 ? (
              <div className="mt-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Roll No
                        </th>
                        <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {students.map((student) => (
                        <tr key={student.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                            {student.registration_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                            {student.student_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                            <input
                              type="checkbox"
                              checked={attendance[student.id]}
                              onChange={(e) =>
                                handleAttendanceChange(student.id, e.target.checked)
                              }
                              className="w-4 h-4 text-blue-600 border rounded focus:ring-blue-500"
                            />
                            <span className="ml-2">
                              {attendance[student.id] ? 'Present' : 'Absent'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : selectedClass && selectedSection ? (
              <div className="text-center py-8 text-gray-500">
                No students found for selected class and section
              </div>
            ) : null}

            <div className="mt-4">
              <button
                type="submit"
                disabled={loading || attendanceAlreadyMarked}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                title={attendanceAlreadyMarked ? 'Attendance already marked for this date' : ''}
              >
                {loading ? 'Submitting...' : 'Submit Attendance'}
              </button>
              {attendanceAlreadyMarked && (
                <p className="text-yellow-600 text-sm mt-2">
                  Attendance has already been marked for this date. Please select a different date or update the existing attendance.
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
   
  );
};

export default MarkAttendance;