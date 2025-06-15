

'use client';
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
import { useRouter } from 'next/navigation';
import { FaPlus, FaMinus } from 'react-icons/fa';
import { useAuth } from '@/app/context/AuthContext';

interface ClassData {
  id: number;
  class_name: string;
  section: string;
}

interface Subject {
  id: string;
  name: string;
  marks: string;
}

const AssignSubjects = () => {
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { user } = useAuth();
  
  // Form states
  const [selectedClass, setSelectedClass] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: '1', name: '', marks: '' }
  ]);
  
  // Data states
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch classes on component mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoadingClasses(true);
        setError('');
        
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token not found');
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
        setClasses(data);
        
      } catch (err) {
        console.error('Error fetching classes:', err);
        setError('Failed to load classes. Please try again.');
      } finally {
        setLoadingClasses(false);
      }
    };
    
    fetchClasses();
  }, []);

  // Handle subject name change
  const handleSubjectNameChange = (id: string, value: string) => {
    setSubjects(prev => prev.map(subject => 
      subject.id === id ? { ...subject, name: value } : subject
    ));
  };

  // Handle subject marks change
  const handleSubjectMarksChange = (id: string, value: string) => {
    if (value === '' || /^\d+$/.test(value)) {
      setSubjects(prev => prev.map(subject => 
        subject.id === id ? { ...subject, marks: value } : subject
      ));
    }
  };

  // Add new subject
  const addSubject = () => {
    const newId = Date.now().toString();
    setSubjects(prev => [...prev, { id: newId, name: '', marks: '' }]);
  };

  // Remove subject
  const removeSubject = (id: string) => {
    if (subjects.length > 1) {
      setSubjects(prev => prev.filter(subject => subject.id !== id));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClass) {
      setError('Please select a class');
      return;
    }

    // Validate subjects
    const validSubjects = subjects.filter(subject => subject.name.trim() && subject.marks.trim());
    if (validSubjects.length === 0) {
      setError('Please add at least one subject with name and marks');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Prepare payload according to backend expectations
      const payload = {
        class_id: selectedClass,
        subject_name: validSubjects.map(subject => subject.name.trim()).join(', '),
        marks: validSubjects.map(subject => subject.marks.trim()).join(', ')
      };

      const response = await fetch(`${baseUrl}/api/registersubject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Successfully assigned subjects to class!`);
        
        // Reset form on success
        setSelectedClass('');
        setSubjects([{ id: '1', name: '', marks: '' }]);
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccess('');
        }, 5000);
      } else {
        // Handle specific error cases
        if (response.status === 409) {
          setError(data.message || 'This class already has subjects assigned');
        } else {
          throw new Error(data.message || 'Failed to assign subjects');
        }
      }
    } catch (err) {
      console.error('Error assigning subjects:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign subjects');
    } finally {
      setLoading(false);
    }
  };

  if (loadingClasses) {
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
      <div className="w-full max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <nav className="text-xs text-gray-500 mb-2">
            <span>Subjects</span>
            <span className="mx-1">→</span>
            <span className="text-gray-900">Assign Subjects</span>
          </nav>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold text-gray-800 mb-1">Assign Subjects to Class</h1>
            <div className="flex justify-center items-center gap-2 text-xs">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-1"></span>
                Required*
              </span>
            </div>
          </div>

          {/* Error and Success Messages */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Class Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-blue-500">Select Class*</span>
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.class_name} ({cls.section})
                  </option>
                ))}
              </select>
            </div>

            {/* Subjects Section */}
            <div className="space-y-4 mb-6">
              {subjects.map((subject, index) => (
                <div key={subject.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-200 rounded-lg">
                  {/* Subject Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="text-blue-500">Subject Name*</span>
                    </label>
                    <input
                      type="text"
                      value={subject.name}
                      onChange={(e) => handleSubjectNameChange(subject.id, e.target.value)}
                      placeholder="Subject Name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      required
                    />
                  </div>

                  {/* Subject Marks */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="text-blue-500">Marks*</span>
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={subject.marks}
                        onChange={(e) => handleSubjectMarksChange(subject.id, e.target.value)}
                        placeholder="Total Marks"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        required
                      />
                      {subjects.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSubject(subject.id)}
                          className="px-4 py-3 bg-red-500 text-white border border-red-500 rounded-r-lg hover:bg-red-600 transition-colors"
                          title="Remove Subject"
                        >
                          <FaMinus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add/Remove Buttons */}
            <div className="flex justify-center gap-4 mb-8">
              <button
                type="button"
                onClick={addSubject}
                className="flex items-center px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <FaPlus className="w-4 h-4 mr-2" />
                Add More Subjects
              </button>
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <button
                type="submit"
                disabled={loading || !selectedClass}
                className="px-8 py-3 bg-orange-400 text-white rounded-lg hover:bg-orange-500 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                {loading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Assigning Subjects...
                  </span>
                ) : (
                  <>
                    <FaPlus className="inline w-4 h-4 mr-2" />
                    Assign Subjects
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AssignSubjects;