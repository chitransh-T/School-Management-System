"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';

interface TeacherAssignment {
  id: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  section: string;
  subjects: string[];
}

interface Teacher {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  maxMarks: string;
}

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || '';

const ViewTeacherAssignmentsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<TeacherAssignment | null>(null);
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    teacherId: '',
    selectedSubjects: new Set<string>(),
  });
  const router = useRouter();

  useEffect(() => {
    loadTokenAndFetchAssignments();
  }, []);

  const loadTokenAndFetchAssignments = async () => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      await fetchAssignments(storedToken);
    } else {
      showError('No token found. Please login again.');
      router.push('/login');
    }
  };

  const fetchAssignments = async (token: string) => {
    setIsLoading(true);
    try {
      const resp = await axios.get(`${baseUrl}/api/teacher-assignments`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (resp.status === 200) {
        const rawData: any[] = resp.data.data || [];
        const grouped: { [key: string]: TeacherAssignment } = {};

        for (const e of rawData) {
          const teacherId = e.teacher_id.toString();
          const teacherName = e.teacher_name || 'Unknown';
          const classId = e.class_id.toString();
          const className = e.class_name || 'Unknown';
          const section = e.section || 'Unknown';
          const subjectName = e.subject_name || '';
          const assignmentId = e.id.toString();
          const key = `${teacherId}|${classId}|${section}`;

          if (!grouped[key]) {
            grouped[key] = {
              id: assignmentId,
              teacherId,
              teacherName,
              classId,
              className,
              section,
              subjects: [],
            };
          }
          
          // Add subject if not empty and not already in the list
          if (subjectName && !grouped[key].subjects.includes(subjectName)) {
            grouped[key].subjects.push(subjectName);
          }
        }

        setAssignments(Object.values(grouped));
      } else {
        showError(`Failed to load assignments. (${resp.status})`);
      }
    } catch (e) {
      showError(`Error: ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableTeachers = async (): Promise<Teacher[]> => {
    try {
      const response = await axios.get(`${baseUrl}/api/teachers`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        return response.data.map((teacher: any) => ({
          id: teacher.id.toString(),
          name: teacher.teacher_name || 'Unknown',
        }));
      }
      return [];
    } catch (e) {
      console.error('Error fetching teachers:', e);
      return [];
    }
  };

  const fetchSubjectsForClass = async (classId: string): Promise<Subject[]> => {
    try {
      const response = await axios.get(`${baseUrl}/api/getallsubjects`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (response.status === 200) {
        const responseData = response.data.data || response.data;
        if (!Array.isArray(responseData)) {
          showError("Invalid subjects data format");
          return [];
        }
  
        // Find the class that matches classId (same logic as AssignTeacherPage)
        const matchedClass = responseData.find(
          (c: any) => parseInt(c.id) === parseInt(classId)
        );
  
        const subjects: Subject[] = [];
        if (matchedClass && Array.isArray(matchedClass.subjects)) {
          matchedClass.subjects.forEach((subject: any) => {
            // Handle comma-separated subject names (same logic as AssignTeacherPage)
            if (subject.subject_name && subject.subject_name.includes(',')) {
              const subjectNames = subject.subject_name
                .split(',')
                .map((name: string) => name.trim())
                .filter((name: string) => name); // Remove empty names
  
              subjectNames.forEach((name: string) => {
                subjects.push({
                  id: subject.id.toString(), // Use the same ID for all split subjects
                  name: name,
                  maxMarks: subject.max_marks || '0',
                });
              });
            } else {
              // Single subject
              const name = subject.subject_name?.trim();
              if (name) {
                subjects.push({
                  id: subject.id.toString(),
                  name: name,
                  maxMarks: subject.max_marks || '0',
                });
              }
            }
          });
        }
  
        if (subjects.length === 0) {
          showError("No subjects found for this class/section.");
        }
  
        return subjects;
      }
      return [];
    } catch (e) {
      console.error('Error fetching subjects:', e);
      showError("Error fetching subjects");
      return [];
    }
  };

  const deleteAssignment = async (assignment: TeacherAssignment) => {
    setSelectedAssignment(assignment);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedAssignment || !token) return;
    try {
      const resp = await axios.delete(`${baseUrl}/api/teacher-assignment/${selectedAssignment.id}`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (resp.status === 200) {
        showSuccess('Deleted successfully.');
        await fetchAssignments(token);
      } else {
        showError(`Failed to delete. (${resp.status})`);
      }
    } catch (e) {
      showError(`Delete error: ${e}`);
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedAssignment(null);
    }
  };

  const editAssignment = async (assignment: TeacherAssignment) => {
    setIsEditLoading(true);
    setIsEditModalOpen(true);
    setSelectedAssignment(assignment);
    
    try {
      // Fetch available teachers and subjects
      const [teachers, subjects] = await Promise.all([
        fetchAvailableTeachers(),
        fetchSubjectsForClass(assignment.classId)
      ]);
      
      setAvailableTeachers(teachers);
      setAvailableSubjects(subjects);
      
      // Initialize form with current values
      setEditForm({
        teacherId: assignment.teacherId,
        selectedSubjects: new Set(assignment.subjects),
      });
    } catch (e) {
      showError(`Error loading data: ${e}`);
      setIsEditModalOpen(false);
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedAssignment || !token || editForm.selectedSubjects.size === 0 || !editForm.teacherId) {
      showError('Please fill all required fields');
      return;
    }

    setIsEditLoading(true);
    try {
      const response = await axios.put(
        `${baseUrl}/api/teacher-assignment/${selectedAssignment.id}`,
        {
          teacher_id: editForm.teacherId,
          subjects: Array.from(editForm.selectedSubjects),
        },
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        showSuccess('Assignment updated successfully!');
        setIsEditModalOpen(false);
        setSelectedAssignment(null);
        await fetchAssignments(token);
      } else {
        showError(`Failed to update assignment (${response.status})`);
      }
    } catch (e) {
      showError(`Error updating assignment: ${e}`);
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleSubjectToggle = (subjectName: string) => {
    const newSelected = new Set(editForm.selectedSubjects);
    if (newSelected.has(subjectName)) {
      newSelected.delete(subjectName);
    } else {
      newSelected.add(subjectName);
    }
    setEditForm({ ...editForm, selectedSubjects: newSelected });
  };

  const showError = (msg: string) => toast.error(msg);
  const showSuccess = (msg: string) => toast.success(msg);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-100">
        <ToastContainer />
        
        <h1 className="text-xl text-blue-900 font-bold p-4">View Assigned Teachers</h1>

        <main className="p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-900"></div>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center text-gray-600">No assignments found.</div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div
                  key={`${assignment.teacherId}|${assignment.classId}|${assignment.section}`}
                  className="bg-white rounded-lg shadow p-4 flex justify-between items-center"
                >
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{assignment.teacherName}</h2>
                    <p className="text-gray-600">
                      Class: {assignment.className} - {assignment.section}
                    </p>
                    <p className="text-gray-600">Subjects: {assignment.subjects.join(', ')}</p>
                  </div>
                  <div className="relative">
                    <button
                      className="text-gray-600 hover:text-gray-800 p-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        const menu = document.getElementById(`menu-${assignment.id}`);
                        if (menu) menu.classList.toggle('hidden');
                      }}
                    >
                      ⋮
                    </button>
                    <div
                      id={`menu-${assignment.id}`}
                      className="hidden absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-10 border"
                    >
                      <button
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-md"
                        onClick={() => editAssignment(assignment)}
                      >
                        Edit
                      </button>
                      <button
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-md"
                        onClick={() => deleteAssignment(assignment)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Edit Modal */}
        {isEditModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
    <div className="bg-white rounded-lg p-4 w-full max-w-lg max-h-[80vh] overflow-y-auto">
      <h2 className="text-lg font-bold mb-3 text-blue-900">Edit Assignment</h2>
      
      {isEditLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-900"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Read-only fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <input
              type="text"
              value={selectedAssignment?.className || ''}
              readOnly
              className="w-full p-2 border rounded bg-gray-100 text-gray-700 text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <input
              type="text"
              value={selectedAssignment?.section || ''}
              readOnly
              className="w-full p-2 border rounded bg-gray-100 text-gray-700 text-sm"
            />
          </div>

          {/* Teacher Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign Teacher</label>
            <select
              value={editForm.teacherId}
              onChange={(e) => setEditForm({ ...editForm, teacherId: e.target.value })}
              className="w-full p-2 border rounded text-gray-700 text-sm"
            >
              <option value="">Select Teacher</option>
              {availableTeachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subjects Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subjects</label>
            
            {/* Currently Selected Display - Compact */}
            {editForm.selectedSubjects.size > 0 && (
              <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                <p className="font-medium text-blue-800 text-xs mb-1">Selected:</p>
                <p className="text-blue-700 text-xs">{Array.from(editForm.selectedSubjects).join(', ')}</p>
              </div>
            )}

            {/* Subject Selection - Compact */}
            <div className="border rounded max-h-32 overflow-y-auto">
              {availableSubjects.length === 0 ? (
                <div className="p-3 text-center text-gray-500 text-sm">
                  No subjects available for this class
                </div>
              ) : (
                availableSubjects.map((subject) => (
                  <div key={subject.id} className="flex items-center p-2 border-b last:border-b-0">
                    <input
                      type="checkbox"
                      id={`subject-${subject.id}`}
                      checked={editForm.selectedSubjects.has(subject.name)}
                      onChange={() => handleSubjectToggle(subject.name)}
                      className="mr-2 h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`subject-${subject.id}`} className="flex-1 cursor-pointer">
                      <div className="text-gray-900 text-sm">{subject.name}</div>
                      {subject.maxMarks !== '0' && (
                        <div className="text-xs text-gray-500">Max: {subject.maxMarks}</div>
                      )}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-end space-x-2">
        <button
          className="px-3 py-1.5 bg-gray-200 rounded hover:bg-gray-300 text-gray-700 text-sm"
          onClick={() => {
            setIsEditModalOpen(false);
            setSelectedAssignment(null);
          }}
          disabled={isEditLoading}
        >
          Cancel
        </button>
        <button
          className="px-3 py-1.5 bg-blue-900 text-white rounded hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
          onClick={handleEditSubmit}
          disabled={isEditLoading || editForm.selectedSubjects.size === 0 || !editForm.teacherId}
        >
          {isEditLoading ? (
            <div className="flex items-center space-x-1">
              <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-white"></div>
              <span>Saving...</span>
            </div>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </div>
  </div>
)}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && selectedAssignment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Confirm Delete</h2>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete {selectedAssignment.teacherName}'s assignment?
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-700"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedAssignment(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  onClick={confirmDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ViewTeacherAssignmentsPage;