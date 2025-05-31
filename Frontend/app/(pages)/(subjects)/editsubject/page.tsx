'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaPlus, FaMinus, FaArrowLeft } from 'react-icons/fa';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
import { useAuth } from '@/app/context/AuthContext';

// Types
interface Subject {
  id?: number;
  name: string;
  marks: number;
}

interface ClassData {
  id: number;
  class_name: string;
  section: string;
  subjects: Subject[];
}

interface ClassOption {
  id: number;
  class_name: string;
}

interface SectionOption {
  id: number;
  section_name: string;
}

export default function EditClassSubjectsPage() {
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Get URL parameters
  const classParam = searchParams.get('class');
  const sectionParam = searchParams.get('section');

  // State management
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([
    { name: '', marks: 0 }
  ]);

  // Options for dropdowns
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  const [sectionOptions, setSectionOptions] = useState<SectionOption[]>([]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token not found');
          return;
        }

        // Fetch classes and sections
        const [classesRes, sectionsRes] = await Promise.all([
          fetch(`${baseUrl}/api/classes`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch(`${baseUrl}/api/sections`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        ]);

        if (classesRes.ok) {
          const classesData = await classesRes.json();
          setClassOptions(classesData);
        }

        if (sectionsRes.ok) {
          const sectionsData = await sectionsRes.json();
          setSectionOptions(sectionsData);
        }

        // Check if we have stored class data from the previous page
        const storedClassData = localStorage.getItem('editClassSubjects');
        
        if (storedClassData) {
          try {
            const parsedData = JSON.parse(storedClassData);
            setClassData(parsedData);
            setSelectedClass(parsedData.class_name);
            setSelectedSection(parsedData.section);
            
            // Pre-fill subjects from stored data
            if (parsedData.subjects && parsedData.subjects.length > 0) {
              setSubjects(parsedData.subjects);
            } else {
              setSubjects([{ name: '', marks: 0 }]);
            }
            
            // Clear the localStorage after using it
            localStorage.removeItem('editClassSubjects');
            return; // Skip the API call if we have stored data
          } catch (err) {
            console.error('Error parsing stored class data:', err);
            // Continue with API call if parsing fails
          }
        }
        
        // If we have class and section parameters but no stored data, fetch from API
        if (classParam && sectionParam) {
          const classSubjectsRes = await fetch(
            `${baseUrl}/api/classes/subjects?class=${encodeURIComponent(classParam)}&section=${encodeURIComponent(sectionParam)}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (classSubjectsRes.ok) {
            const data = await classSubjectsRes.json();
            setClassData(data);
            setSelectedClass(data.class_name);
            setSelectedSection(data.section);
            
            // Pre-fill subjects or add empty one if none exist
            if (data.subjects && data.subjects.length > 0) {
              setSubjects(data.subjects);
            } else {
              setSubjects([{ name: '', marks: 0 }]);
            }
          }
        }

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classParam, sectionParam]);

  // Add new subject row
  const addSubject = () => {
    setSubjects([...subjects, { name: '', marks: 0 }]);
  };

  // Remove subject row
  const removeSubject = (index: number) => {
    if (subjects.length > 1) {
      const newSubjects = subjects.filter((_, i) => i !== index);
      setSubjects(newSubjects);
    }
  };

  // Update subject
  const updateSubject = (index: number, field: 'name' | 'marks', value: string | number) => {
    const newSubjects = [...subjects];
    newSubjects[index] = {
      ...newSubjects[index],
      [field]: field === 'marks' ? Number(value) : value
    };
    setSubjects(newSubjects);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClass || !selectedSection) {
      setError('Please select both class and section');
      return;
    }

    // Validate subjects
    const validSubjects = subjects.filter(subject => 
      subject.name.trim() !== '' && subject.marks > 0
    );

    if (validSubjects.length === 0) {
      setError('Please add at least one valid subject');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      // Format subjects for the API
      const formattedSubjects = validSubjects.map(subject => ({
        subject_name: subject.name,
        marks: subject.marks,
        class_name: selectedClass
      }));

      // Call the backend API to update subjects
      const response = await fetch(`${baseUrl}/api/updatesubject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject_id: classData?.id,
          subjects: formattedSubjects
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update subjects: ${response.status}`);
      }

      setSuccess('Subjects updated successfully!');
      
      // Redirect back to classes list after a delay
      setTimeout(() => {
        router.push('/classeswithsubject');
      }, 2000);

    } catch (err) {
      console.error('Error updating subjects:', err);
      setError('Failed to update subjects. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    router.back();
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

  return (
    <DashboardLayout>
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <nav className="text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
            <span>Subjects</span>
            <span className="mx-2">→</span>
            <span className="text-gray-900">Edit Class Subjects</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">Edit Class Subjects</h1>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <span className="ml-2 text-blue-600 font-medium">Select</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <span className="ml-2 text-gray-500">Confirm</span>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* Main Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Class and Section Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-blue-600 mb-2">
                  Class
                </label>
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-medium">
                  {selectedClass}
                </div>
                <input type="hidden" value={selectedClass} name="class" />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-600 mb-2">
                  Section
                </label>
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-medium">
                  {selectedSection}
                </div>
                <input type="hidden" value={selectedSection} name="section" />
              </div>
            </div>

            {/* Subjects */}
            <div className="space-y-4">
              {subjects.map((subject, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-blue-600 mb-2">
                      Subject Name*
                    </label>
                    <input
                      type="text"
                      value={subject.name}
                      onChange={(e) => updateSubject(index, 'name', e.target.value)}
                      placeholder="Name Of Subject"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="flex items-end space-x-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-blue-600 mb-2">
                        Marks*
                      </label>
                      <input
                        type="number"
                        value={subject.marks}
                        onChange={(e) => updateSubject(index, 'marks', e.target.value)}
                        placeholder="Total Exam Marks"
                        min="1"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    {subjects.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSubject(index)}
                        className="p-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove Subject"
                      >
                        <FaMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add More Button */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={addSubject}
                className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <FaPlus className="w-4 h-4 mr-2" />
                Add More
              </button>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-6">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaPlus className="w-4 h-4 mr-2" />
                {saving ? 'Updating...' : 'Update Subjects'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}