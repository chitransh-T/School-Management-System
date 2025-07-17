// 'use client';

// import React, { useState, useEffect } from 'react';
// import Image from 'next/image';
// import { useRouter } from 'next/navigation';
// import DashboardLayout from '../../dashboardComponents/DashboardLayout';
// import Calendar from '@/app/components/calender';

// interface Student {
//   student_name?: string;
//   assigned_class?: string;
//   assigned_section?: string;
//   student_photo?: string;
//   teacher_name?: string;
// }

// interface Notice {
//   id: number;
//   title: string;
//   content: string;
//   created_at: string;
// }

// const ParentDashboard: React.FC = () => {
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const [errorMessage, setErrorMessage] = useState<string | null>(null);
//   const [studentData, setStudentData] = useState<Student[]>([]);
//   const [notices, setNotices] = useState<Notice[]>([]);
//   const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
//   const router = useRouter();

//   useEffect(() => {
//     fetchParentStudents();
//     fetchNotices();
//   }, []);

//   const fetchParentStudents = async () => {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       setErrorMessage('Token missing. Please login again.');
//       setIsLoading(false);
//       return;
//     }

//     try {
//       const response = await fetch(`${baseUrl}/api/dashboard/students`, {
//         headers: {
//           Accept: 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       const data = await response.json();
//       if (response.ok && data.data) {
//         setStudentData(data.data);
//       } else {
//         setErrorMessage('Failed to load student data.');
//       }
//     } catch (e) {
//       setErrorMessage(`Error fetching data: ${e}`);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const fetchNotices = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       const res = await fetch(`${baseUrl}/api/notices`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       const data = await res.json();
//       if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch notices');

//       setNotices(data.data || []);
//     } catch (err: any) {
//       console.error('Notice fetch error:', err);
//       setErrorMessage('Unable to load notices.');
//     }
//   };

//   const StudentCard: React.FC<{ student: Student }> = ({ student }) => {
//     const photoUrl = student.student_photo
//       ? `${baseUrl}/uploads/${student.student_photo}`
//       : '/images/student_default.png';

//     return (
//       <div className="bg-white shadow rounded-lg p-4 flex items-center space-x-4 transition hover:shadow-md">
//         <Image
//           src={photoUrl}
//           alt={student.student_name || 'Student'}
//           width={64}
//           height={64}
//           className="rounded-full object-cover bg-gray-200"
//         />
//         <div>
//           <h3 className="text-lg font-bold text-gray-800">{student.student_name || 'Unnamed'}</h3>
//           <p className="text-sm text-gray-600 mt-1">
//             Class: <span className="font-semibold">{student.assigned_class || 'N/A'}</span> | Section:{' '}
//             <span className="font-semibold">{student.assigned_section || 'N/A'}</span>
//           </p>
//           <p className="text-sm text-gray-600 mt-1">
//             Teacher: <span className="font-medium">{student.teacher_name || 'N/A'}</span>
//           </p>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <DashboardLayout>
//       <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-10">
//         <main className="max-w-6xl mx-auto w-full">
//           {isLoading ? (
//             <div className="flex justify-center items-center h-64">
//               <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500 border-opacity-50" />
//             </div>
//           ) : errorMessage ? (
//             <div className="text-center text-red-600 text-lg">{errorMessage}</div>
//           ) : (
//             <>
//               {/* Students Section */}
//               <section className="mb-10">
//                 <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Children</h2>
//                 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
//                   {studentData.map((student, index) => (
//                     <StudentCard key={index} student={student} />
//                   ))}
//                 </div>
//               </section>

//               {/* Notices & Calendar */}
//               <section className="flex flex-col lg:flex-row gap-8">
//                 {/* Notices */}
//                 <div className="flex-1">
//                   <h2 className="text-2xl font-bold text-gray-800 mb-4">Notices</h2>
//                   {notices.length > 0 ? (
//                     <div className="space-y-4">
//                       {notices.map((notice) => (
//                         <div
//                           key={notice.id}
//                           className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded shadow-sm"
//                         >
//                           <h3 className="text-lg font-semibold text-yellow-800">{notice.title}</h3>
//                           <p className="text-sm text-gray-700 mt-1">{notice.content}</p>
//                           <p className="text-xs text-gray-500 mt-2">
//                             {new Date(notice.created_at).toLocaleDateString()}
//                           </p>
//                         </div>
//                       ))}
//                     </div>
//                   ) : (
//                     <p className="text-gray-600">No notices available.</p>
//                   )}
//                 </div>

//                 {/* Calendar */}
//                 <div className="w-full lg:w-80">
//                   <h2 className="text-2xl font-bold text-gray-800 mb-4">Calendar</h2>
//                   <div className="bg-white rounded-lg shadow-md p-4">
//                     <Calendar />
//                   </div>
//                 </div>
//               </section>
//             </>
//           )}
//         </main>
//       </div>
//     </DashboardLayout>
//   );
// };

// export default ParentDashboard;
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../dashboardComponents/DashboardLayout';
import Calendar from '@/app/components/calender';

interface Student {
  student_name?: string;
  assigned_class?: string;
  assigned_section?: string;
  student_photo?: string;
  teacher_name?: string;
  institute_name?: string; // Added institute_name
}

interface Notice {
  id: number;
  title: string;
  content: string;
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

      const data = await response.json();
      if (response.ok && data.data) {
        setStudentData(data.data);
      } else {
        setErrorMessage('Failed to load student data.');
      }
    } catch (e) {
      setErrorMessage(`Error fetching data: ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotices = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${baseUrl}/api/notices`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch notices');

      setNotices(data.data || []);
    } catch (err: any) {
      console.error('Notice fetch error:', err);
      setErrorMessage('Unable to load notices.');
    }
  };

  const StudentCard: React.FC<{ student: Student }> = ({ student }) => {
    const photoUrl = student.student_photo
      ? `${baseUrl}/Uploads/${student.student_photo}`
      : '/images/student_default.png';

    return (
      <div className="bg-white shadow rounded-lg p-4 flex items-center space-x-4 transition hover:shadow-md">
        <Image
          src={photoUrl}
          alt={student.student_name || 'Student'}
          width={64}
          height={64}
          className="rounded-full object-cover bg-gray-200"
        />
        <div>
          <h3 className="text-lg font-bold text-gray-800">{student.student_name || 'Unnamed'}</h3>
          <p className="text-sm text-gray-600 mt-1">
            Class: <span className="font-semibold">{student.assigned_class || 'N/A'}</span> | Section:{' '}
            <span className="font-semibold">{student.assigned_section || 'N/A'}</span>
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Teacher: <span className="font-medium">{student.teacher_name || 'N/A'}</span>
          </p>
        </div>
      </div>
    );
  };

  // Extract institute_name from the first student, similar to Flutter
  const instituteName = studentData.length > 0
    ? studentData[0].institute_name || 'School Name Not Available'
    : '';

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-10">
        <main className="max-w-6xl mx-auto w-full">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500 border-opacity-50" />
            </div>
          ) : errorMessage ? (
            <div className="text-center text-red-600 text-lg">{errorMessage}</div>
          ) : (
            <>
              {/* Students Section */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Children</h2>
                {instituteName && (
                  <p className="text-lg font-semibold text-gray-800 mb-4">
                    Welcome to {instituteName}
                  </p>
                )}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                  {studentData.map((student, index) => (
                    <StudentCard key={index} student={student} />
                  ))}
                </div>
              </section>

              {/* Notices & Calendar */}
              <section className="flex flex-col lg:flex-row gap-8">
                {/* Notices */}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Notices</h2>
                  {notices.length > 0 ? (
                    <div className="space-y-4">
                      {notices.map((notice) => (
                        <div
                          key={notice.id}
                          className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded shadow-sm"
                        >
                          <h3 className="text-lg font-semibold text-yellow-800">{notice.title}</h3>
                          <p className="text-sm text-gray-700 mt-1">{notice.content}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(notice.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No notices available.</p>
                  )}
                </div>

                {/* Calendar */}
                <div className="w-full lg:w-80">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Calendar</h2>
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <Calendar />
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
};

export default ParentDashboard;