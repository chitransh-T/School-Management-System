
//--------------------------------------------------------------------
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaPlus, FaEdit } from 'react-icons/fa';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
import { useAuth } from '@/app/context/AuthContext';

// Types
interface Subject {
  id: number;
  subject_name: string;
  marks: number;
}

interface ClassWithSubjects {
  id: number; // This should be the class_id from your database
  class_name: string;
  section: string;
  signup_id: number;
  subjects: Subject[];
  total_subjects: number;
  total_marks: number;
}

// Main Page Component
export default function ClassesWithSubjectsPage() {
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { user } = useAuth();
  
  // State management
  const [classesData, setClassesData] = useState<ClassWithSubjects[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch classes with subjects data
  useEffect(() => {
    const fetchClassesWithSubjects = async () => {
      try {
        setLoading(true);
        setError('');
        
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token not found');
          return;
        }
        
        const response = await fetch(`${baseUrl}/api/getallsubjects`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch classes with subjects: ${response.status}`);
        }
        
        const responseData = await response.json();
        console.log('Classes with subjects data:', responseData);
        
        if (!responseData.data || !Array.isArray(responseData.data)) {
          throw new Error('Invalid data format received from server');
        }
        
        // Process the data to calculate totals
        const processedData = responseData.data.map((classItem: any) => {
          // Get the subjects array
          let subjectsArray = classItem.subjects || [];
          
          // Check if any subject has subject_name as a comma-separated string
          // This happens when subjects are stored as a single record with comma-separated values
          const processedSubjects: Subject[] = [];
          
          subjectsArray.forEach((subject: any) => {
            // Check if subject_name contains commas (multiple subjects)
            if (subject.subject_name && subject.subject_name.includes(',')) {
              const subjectNames = subject.subject_name.split(',').map((name: string) => name.trim());
              let markValues: number[] = [];
              
              // Handle marks - could be a comma-separated string or a single value
              if (typeof subject.marks === 'string' && subject.marks.includes(',')) {
                markValues = subject.marks.split(',').map((mark: string) => {
                  const parsedMark = parseInt(mark.trim());
                  return isNaN(parsedMark) ? 0 : parsedMark;
                });
              } else {
                // If marks is not comma-separated, use the same mark for all subjects
                const singleMark = typeof subject.marks === 'string' ? 
                  parseInt(subject.marks) : 
                  (typeof subject.marks === 'number' ? subject.marks : 0);
                markValues = Array(subjectNames.length).fill(singleMark);
              }
              
              // Create individual subject objects
              subjectNames.forEach((name: string, index: number) => {
                if (name) { // Only add if name is not empty
                  processedSubjects.push({
                    id: subject.id, // Use the subject ID from database
                    subject_name: name,
                    marks: markValues[index] || 0
                  });
                }
              });
            } else {
              // Single subject, just add it
              processedSubjects.push({
                id: subject.id, // Use the subject ID from database
                subject_name: subject.subject_name,
                marks: typeof subject.marks === 'string' ? parseInt(subject.marks) : subject.marks
              });
            }
          });
          
          return {
            id: classItem.id, // This should be the class_id
            class_name: classItem.class_name,
            section: classItem.section,
            signup_id: classItem.signup_id,
            subjects: processedSubjects,
            total_subjects: processedSubjects.length,
            total_marks: processedSubjects.reduce((sum: number, subject: Subject) => {
              const markValue = typeof subject.marks === 'string' ? parseInt(subject.marks) : subject.marks;
              return sum + (isNaN(markValue) ? 0 : markValue);
            }, 0)
          };
        });
        
        setClassesData(processedData);
        
      } catch (err) {
        console.error('Error fetching classes with subjects:', err);
        setError('Failed to load classes data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchClassesWithSubjects();
  }, []);

  // Navigate to assign subjects page
  const handleAssignSubjects = () => {
    router.push('/assignSubject');
  };

  // Handle edit class subjects
  const handleEditClass = (classItem: ClassWithSubjects) => {
    // Validate required data
    if (!classItem.id || !classItem.class_name || !classItem.section) {
      console.error('Missing required class data:', classItem);
      setError('Missing class information. Please refresh and try again.');
      return;
    }

    // Create URL parameters
    const searchParams = new URLSearchParams({
      class: classItem.class_name,
      section: classItem.section,
      id: classItem.id.toString()
    });
    
    // Prepare edit data - find the first subject's ID to use as subject_id
    const firstSubject = classItem.subjects && classItem.subjects.length > 0 ? classItem.subjects[0] : null;
    
    const editData = {
      id: classItem.id, // class_id
      class_id: classItem.id, // Explicit class_id
      subject_id: firstSubject?.id, // The subject record ID for updating
      class_name: classItem.class_name,
      section: classItem.section,
      subjects: classItem.subjects?.map(subject => ({
        id: subject.id, // Include subject ID
        name: subject.subject_name,
        marks: typeof subject.marks === 'string' ? parseInt(subject.marks) : subject.marks
      })) || []
    };
    
    console.log('Storing edit data:', editData);
    sessionStorage.setItem('editClassSubjects', JSON.stringify(editData));
    router.push(`/editsubject?${searchParams.toString()}`);
  };

  // Create subject display component
  const SubjectDisplay = ({ marks, subject }: { marks: number; subject: string }) => {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-md p-2 w-20 h-20 flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-gray-900">{marks}</span>
        <span className="text-xs text-gray-600">Marks</span>
        <span className="text-xs font-medium text-blue-600 truncate w-16 text-center">{subject}</span>
      </div>
    );
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
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full">
        {/* Page Header */}
        <div className="mb-8">
          <nav className="text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
            <span>Subjects</span>
            <span className="mx-2">→</span>
            <span className="text-gray-900">Classes With Subjects</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">Classes With Subjects</h1>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {classesData.map((classItem) => (
            <div key={classItem.id} className="bg-white rounded-lg shadow-md p-3 relative"> 
              {/* Edit Button */}
              <button
                onClick={() => handleEditClass(classItem)}
                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-blue-600 transition-colors" 
                title="Edit Class Subjects"
                aria-label={`Edit subjects for ${classItem.class_name} ${classItem.section}`}
              >
                <FaEdit className="w-3 h-3" /> 
              </button>

              {/* Class Header */}
              <div className="text-center mb-3">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {classItem.class_name}
                </h2>
                <div className="flex items-center justify-center space-x-2">
                  <div>
                    <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-medium inline-block">
                      {classItem.total_subjects}
                    </span>
                    <p className="pt-1 text-xs text-gray-600 uppercase">
                      Subjects
                    </p>
                  </div>
                  <div>
                    <span className="text-lg font-bold text-gray-900 block">
                      {classItem.total_marks}
                    </span>
                    <p className="text-xs text-orange-500 uppercase">
                      Marks
                    </p>
                  </div>
                </div>
              </div>

            
              {/* Subjects List */}
              <div className="flex flex-wrap justify-center gap-2">
                {classItem.subjects && classItem.subjects.length > 0 ? (
                  classItem.subjects.map((subject, index) => (
                    <div key={subject.id || index}>
                      <SubjectDisplay 
                        marks={typeof subject.marks === 'string' ? parseInt(subject.marks) : subject.marks} 
                        subject={subject.subject_name}
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-3"> 
                    <p className="text-gray-500 text-xs mb-2">No subjects</p> 
                    <button
                      onClick={handleAssignSubjects}
                      className="inline-flex items-center px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs" 
                    >
                      <FaPlus className="w-2 h-2 mr-1" /> 
                      Add
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add New Class Card */}
          <div className="bg-white rounded-lg shadow-md border-2 border-dashed border-blue-300 p-3 flex flex-col items-center justify-center hover:border-blue-500 transition-colors cursor-pointer">
            <button
              onClick={handleAssignSubjects}
              className="flex flex-col items-center text-blue-500 hover:text-blue-600 transition-colors"
              aria-label="Assign subjects to a new class"
            >
              <div className="w-10 h-10 border-2 border-blue-300 border-dashed rounded-lg flex items-center justify-center mb-2">
                <FaPlus className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">Assign</span>
              <span className="text-sm font-medium">Subjects</span>
            </button>
          </div>
        </div>

        {/* Empty State */}
        {classesData.length === 0 && (
          <div className="text-center py-6">
            <div className="max-w-sm mx-auto">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FaPlus className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-1">
                No Classes with Subjects
              </h3>
              <p className="text-sm text-gray-500 mb-4"> 
                Get started by assigning subjects to your classes
              </p>
              <button
                onClick={handleAssignSubjects}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm" 
              >
                <FaPlus className="w-3 h-3 mr-2" /> 
                Assign Subjects
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}


