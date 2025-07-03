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

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || '';

const ViewTeacherAssignmentsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<TeacherAssignment | null>(null);
  const [editForm, setEditForm] = useState({
    teacherName: '',
    className: '',
    section: '',
    subjects: '',
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
      router.push('/login'); // Adjust login route as needed
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
          grouped[key].subjects.push(subjectName);
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

  const editAssignment = (assignment: TeacherAssignment) => {
    setSelectedAssignment(assignment);
    setEditForm({
      teacherName: assignment.teacherName,
      className: assignment.className,
      section: assignment.section,
      subjects: assignment.subjects.join(', '),
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    showSuccess('Edit saved (dummy action). Implement update logic if needed.');
    setIsEditModalOpen(false);
    setSelectedAssignment(null);
  };

  const showError = (msg: string) => toast.error(msg);
  const showSuccess = (msg: string) => toast.success(msg);

  return (
    <DashboardLayout>
    <div className="min-h-screen bg-gray-100">
      <ToastContainer />
      {/* App Bar */}
      <header className="bg-blue-900 text-white p-4">
        <h1 className="text-xl font-bold">View Assigned Teachers</h1>
      </header>

      {/* Main Content */}
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
                    className="text-gray-600 hover:text-gray-800"
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
                    className="hidden absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-10"
                  >
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => editAssignment(assignment)}
                    >
                      Edit
                    </button>
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Edit Assignment</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={editForm.teacherName}
                onChange={(e) => setEditForm({ ...editForm, teacherName: e.target.value })}
                placeholder="Teacher"
                className="w-full p-2 border rounded text-gray-500"
              />
              <input
                type="text"
                value={editForm.className}
                onChange={(e) => setEditForm({ ...editForm, className: e.target.value })}
                placeholder="Class"
                className="w-full p-2 border rounded text-gray-500"
              />
              <input
                type="text"
                value={editForm.section}
                onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                placeholder="Section"
                className="w-full p-2 border rounded text-gray-500"
              />
              <input
                type="text"
                value={editForm.subjects}
                onChange={(e) => setEditForm({ ...editForm, subjects: e.target.value })}
                placeholder="Subjects (comma separated)"
                className="w-full p-2 border rounded text-gray-500"
              />
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-700"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800"
                onClick={handleEditSubmit}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p>
              Are you sure you want to delete {selectedAssignment.teacherName}&apos;s assignment?
            </p>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setIsDeleteModalOpen(false)}
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