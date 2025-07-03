

'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../dashboardComponents/DashboardLayout';

interface Student {
  student_name?: string;
  assigned_class?: string;
  assigned_section?: string;
  student_photo?: string;
}

interface Notice {
  id: number;
  title: string;
  description: string;
  created_at: string;
}

const ParentDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<Student[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const router = useRouter();

  useEffect(() => {
    fetchParentStudents();
    fetchNotices();
  }, []);

  const fetchParentStudents = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMessage('Token missing. Please login again.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/api/dashboard/students`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        const data = await response.json();
        setStudentData(data.data || []);
        setIsLoading(false);
        console.log('✅ Student data fetched:', data.data);
      } else if (response.status === 401) {
        setErrorMessage('Unauthorized. Please login again.');
        setIsLoading(false);
      } else {
        setErrorMessage('Failed to load student data.');
        setIsLoading(false);
      }
    } catch (e) {
      setErrorMessage(`Error fetching data: ${e}`);
      setIsLoading(false);
    }
  };

  const fetchNotices = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${baseUrl}/api/notices`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to fetch notices");

      setNotices(data.data || []);
    } catch (err: any) {
      console.error("Notice fetch error:", err);
      setErrorMessage("Unable to load notices.");
    }
  };

  const StudentCard: React.FC<{ student: Student }> = ({ student }) => {
    const photoFileName = student.student_photo || '';
    const photoUrl = photoFileName ? `${baseUrl}/uploads/${photoFileName}` : '';

    return (
      <div className="bg-white shadow-md rounded-lg p-4 flex items-center space-x-4 hover:bg-gray-50 cursor-pointer transition">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={student.student_name || 'Student'}
            width={50}
            height={50}
            className="rounded-full object-cover"
          />
        ) : (
          <Image
            src="/images/student_default.png"
            alt="Default Student"
            width={50}
            height={50}
            className="rounded-full bg-gray-200 object-cover"
          />
        )}
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{student.student_name || 'Unnamed'}</h3>
          <p className="text-sm text-gray-600">
            Class: {student.assigned_class || 'N/A'} - Section: {student.assigned_section || 'N/A'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">
        <main className="w-full max-w-4xl">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : errorMessage ? (
            <div className="text-center text-red-500 text-lg">{errorMessage}</div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Children</h2>
              <div className="space-y-4 mb-8 w">
                {studentData.map((student, index) => (
                  <StudentCard key={index} student={student} />
                ))}
              </div>

              <div className="mt-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Notices</h2>
                {notices.length > 0 ? (
                  <ul className="space-y-3">
                    {notices.map((notice) => (
                      <li
                        key={notice.id}
                        className="bg-yellow-50 p-4 rounded shadow text-yellow-900"
                      >
                        <h3 className="text-lg font-semibold">{notice.title}</h3>
                        <p className="text-md">{notice.description}</p>
                        <p className="text-md text-gray-600 mt-1">
                          Date: {new Date(notice.created_at).toLocaleDateString()}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600">No notices available.</p>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
};

export default ParentDashboard;
