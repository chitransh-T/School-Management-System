
// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation'; // Add useRouter for handling 401 errors
// import ResponsiveContainer from '../components/ResponsiveContainer';
// import ResponsiveText from '../components/ResponsiveText';
// import { useAuth } from '../context/AuthContext';
// import Calendar from '../components/calender';

// interface Notice {
//   id: number;
//   title: string;
//   content: string;
//   notice_date: string;
//   category: string;
//   priority: string;
//   user_email?: string;
// }

// interface DashboardStats {
//   totalStudents: number;
//   totalTeachers: number;
//   totalClasses: number;
//   notices: Notice[];
// }

// interface ProfileData {
//   institute_name: string;
//   address: string;
//   logo: string | null;
// }

// // Format date to show only date (e.g., "Jan 1, 2025")
// const formatDate = (dateString: string) => {
//   if (!dateString) return 'N/A';
  
//   try {
//     const date = new Date(dateString);
    
//     // Check if date is valid
//     if (isNaN(date.getTime())) {
//       return dateString; // Return original string if invalid date
//     }
    
//     // Format as: "Jan 1, 2025"
//     return new Intl.DateTimeFormat('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//     }).format(date);
//   } catch (error) {
//     console.error('Error formatting date:', error);
//     return dateString; // Return original string on error
//   }
// };

// // Cache object to persist notice data
// const dataCache = {
//   notices: null as Notice[] | null,
//   lastFetchTime: 0,
//   totalStudents: 0,
//   totalTeachers: 0,
//   totalClasses: 0,
//   instituteName: null as string | null,
//   profileLastFetchTime: 0,
// };

// const Stats = () => {
//   const { user } = useAuth();
//   const router = useRouter(); // Add router for handling 401 errors
//   const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
//   const [stats, setStats] = useState<DashboardStats>({
//     totalStudents: dataCache.totalStudents || 0,
//     totalTeachers: dataCache.totalTeachers || 0,
//     totalClasses: dataCache.totalClasses || 0,
//     notices: dataCache.notices || [],
//   });
//   const [instituteName, setInstituteName] = useState<string>(dataCache.instituteName || '');
//   const [loading, setLoading] = useState(dataCache.notices === null);
//   const [error, setError] = useState<string | null>(null);

//   // Fetch institute profile (unchanged)
//   const fetchInstituteProfile = async () => {
//     if (!user?.email) return;

//     const now = Date.now();
//     const profileCacheAge = now - dataCache.profileLastFetchTime;
//     const isProfileCacheValid = dataCache.instituteName && profileCacheAge < 600000; // 10 minutes

//     if (isProfileCacheValid) {
//       setInstituteName(dataCache.instituteName || '');
//       return;
//     }

//     try {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         console.warn('No token found for profile fetch');
//         return;
//       }

//       const response = await fetch(`${baseUrl}/api/profile`, {
//         method: 'GET',
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });

//       if (response.ok) {
//         const data = await response.json();
//         if (data.success && data.data?.institute_name) {
//           const instituteNameValue = data.data.institute_name;
//           dataCache.instituteName = instituteNameValue;
//           dataCache.profileLastFetchTime = now;
//           setInstituteName(instituteNameValue);
//         }
//       } else if (response.status === 404) {
//         console.log('Profile not found, using default welcome message');
//       } else {
//         console.warn('Failed to fetch profile:', response.status);
//       }
//     } catch (error) {
//       console.error('Error fetching institute profile:', error);
//     }
//   };

//   // Fetch notices (aligned with TeacherDashboardPage)
//   const fetchNotices = async () => {
//     if (!user) return;

//     const now = Date.now();
//     const cacheAge = now - dataCache.lastFetchTime;
//     const isCacheValid = dataCache.notices !== null && cacheAge < 60000; // 1 minute

//     if (isCacheValid) {
//       setStats((prev) => ({
//         ...prev,
//         notices: dataCache.notices || [],
//       }));
//       return;
//     }

//     try {
//       setLoading(true); // Show loading only if no cache
//       const token = localStorage.getItem('token');
//       if (!token) {
//         throw new Error('No token found. Please log in.');
//       }

//       const response = await fetch(`${baseUrl}/api/notices`, {
//         method: 'GET',
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         cache: 'no-store',
//       });

//       if (!response.ok) {
//         if (response.status === 401) {
//           localStorage.removeItem('token');
//           router.push('/login');
//           return;
//         }
//         throw new Error(`Failed to fetch notices: ${response.status}`);
//       }

//       const data = await response.json();
//       if (data.success && Array.isArray(data.data)) {
//         dataCache.notices = data.data;
//         dataCache.lastFetchTime = now;
//         setStats((prev) => ({
//           ...prev,
//           notices: data.data,
//         }));
//       } else {
//         dataCache.notices = [];
//         dataCache.lastFetchTime = now;
//         setStats((prev) => ({
//           ...prev,
//           notices: [],
//         }));
//       }
//     } catch (error) {
//       console.error('Error fetching notices:', error);
//       setError('Failed to load notices');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fetch dashboard data (unchanged, but simplified for clarity)
  // const fetchDashboardData = async () => {
  //   if (!user?.email) {
  //     setLoading(false);
  //     return;
  //   }

  //   try {
  //     setLoading(true);
  //     setError(null);

  //     const token = localStorage.getItem('token');
  //     if (!token) {
  //       throw new Error('Authentication token not found. Please log in.');
  //     }

  //     const headers = {
  //       Authorization: `Bearer ${token}`,
  //       'Content-Type': 'application/json',
  //     };

  //     const [studentResponse, teacherResponse, classesResponse] = await Promise.all([
  //       fetch(`${baseUrl}/api/api/students/count?user_email=${encodeURIComponent(user.email)}`, { headers }),
  //       fetch(`${baseUrl}/api/api/teachers/count?user_email=${encodeURIComponent(user.email)}`, { headers }),
  //       fetch(`${baseUrl}/api/count`, { headers }),
  //     ]);

  //     if (!studentResponse.ok || !teacherResponse.ok) {
  //       throw new Error('Failed to fetch counts');
  //     }

  //     const studentData = await studentResponse.json();
  //     const teacherData = await teacherResponse.json();
  //     const classesData = classesResponse.ok ? await classesResponse.json() : { totalClasses: 0 };

  //     dataCache.totalStudents = studentData.totalStudents || 0;
  //     dataCache.totalTeachers = teacherData.totalTeachers || 0;
  //     dataCache.totalClasses = classesData.totalClasses || 0;
  //     dataCache.lastFetchTime = Date.now();

  //     setStats({
  //       totalStudents: dataCache.totalStudents,
  //       totalTeachers: dataCache.totalTeachers,
  //       totalClasses: dataCache.totalClasses,
  //       notices: dataCache.notices || [],
  //     });
  //   } catch (error) {
  //     console.error('Error fetching dashboard data:', error);
  //     setError(error instanceof Error ? error.message : 'Failed to fetch dashboard data');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

//   // Polling for notices (aligned with TeacherDashboardPage)
//   useEffect(() => {
//     if (!user) return;

//     fetchInstituteProfile();
//     fetchDashboardData();
//     fetchNotices(); // Initial fetch

//     const pollingIntervalId = setInterval(() => {
//       fetchNotices(); // Background refresh
//     }, 3000); // 30 seconds, matching TeacherDashboardPage

//     return () => clearInterval(pollingIntervalId);
//   }, [user]);

//   if (error) {
//     return (
//       <div className="w-full">
//         <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
//           <div className="flex items-center">
//             <div className="flex-shrink-0">
//               <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
//                 <path
//                   fillRule="evenodd"
//                   d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
//                   clipRule="evenodd"
//                 />
//               </svg>
//             </div>
//             <div className="ml-3">
//               <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
//               <p className="text-sm text-red-700 mt-1">{error}</p>
//             </div>
//             <div className="ml-auto">
//               <button
//                 onClick={fetchDashboardData}
//                 className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
//               >
//                 Retry
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="w-full">
//       {loading ? (
//         <div className="flex justify-center items-center h-64">
//           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
//           <p className="ml-3 text-gray-600">Loading dashboard data...</p>
//         </div>
//       ) : (
//         <>
//           {/* Header */}
//           <div className="flex justify-between items-center mb-6">
//             <h1 className="text-2xl font-bold text-gray-900">
//               {instituteName ? `Welcome to ${instituteName}` : 'Welcome Dashboard'}
//             </h1>
//           </div>

//           {/* Stats Cards */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
//             <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
//               <div className="flex items-center">
//                 <div className="p-2 bg-blue-100 rounded-lg">
//                   <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
//                     />
//                   </svg>
//                 </div>
//                 <div className="ml-4">
//                   <h2 className="text-base sm:text-lg font-semibold text-gray-700">Total Students</h2>
//                   <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.totalStudents}</p>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
//               <div className="flex items-center">
//                 <div className="p-2 bg-green-100 rounded-lg">
//                   <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
//                   </svg>
//                 </div>
//                 <div className="ml-4">
//                   <h2 className="text-base sm:text-lg font-semibold text-gray-700">Total Teachers</h2>
//                   <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.totalTeachers}</p>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow sm:col-span-2 md:col-span-1">
//               <div className="flex items-center">
//                 <div className="p-2 bg-orange-100 rounded-lg">
//                   <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M4 5l4-2 4 2m6 0l4-2 4 2m-2 6h-2m-2-4h-2m-6-2H6m2 6H4"
//                     />
//                   </svg>
//                 </div>
//                 <div className="ml-4">
//                   <h2 className="text-base sm:text-lg font-semibold text-gray-700">Total Classes</h2>
//                   <p className="text-xl sm:text-2xl font-bold text-orange-600">{stats.totalClasses}</p>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Main Content Grid */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             {/* Left Column - Notices Section */}
//             <div className="md:col-span-2">
//               <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
//                 <div className="flex justify-between items-center mb-3 sm:mb-4">
//                   <div className="flex items-center">
//                     <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
//                     </svg>
//                     <h2 className="text-base sm:text-lg font-semibold text-gray-700">Notices</h2>
//                   </div>
//                    <button 
//                     onClick={() => fetchNotices()}
//                     className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
//                     disabled={loading}
//                     title="Refresh notices"
//                   >
//                     {loading ? (
//                       <>
//                         <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                         </svg>
//                         Refreshing...
//                       </>
//                     ) : (
//                       <>Refresh</>
//                     )}
//                   </button> 
//                 </div>
//                 {loading && stats.notices.length === 0 ? (
//                   <div className="flex justify-center items-center h-32">
//                     <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-red-500"></div>
//                     <p className="ml-3 text-gray-600 text-sm">Loading notices...</p>
//                   </div>
//                 ) : stats.notices && stats.notices.length > 0 ? (
//                   <div className="space-y-3 sm:space-y-4 max-h-[400px] overflow-y-auto pr-1">
//                     {stats.notices.map((notice, index) => {
//                       // Determine priority color
//                       let priorityColor = 'border-gray-400';
//                       let bgColor = 'bg-gray-50';
                      
//                       if (notice.priority === 'high') {
//                         priorityColor = 'border-red-400';
//                         bgColor = 'bg-red-50';
//                       } else if (notice.priority === 'medium') {
//                         priorityColor = 'border-yellow-400';
//                         bgColor = 'bg-yellow-50';
//                       } else if (notice.priority === 'low') {
//                         priorityColor = 'border-green-400';
//                         bgColor = 'bg-green-50';
//                       }
                      
//                       return (
//                         <div 
//                           key={notice.id || index} 
//                           className={`p-3 sm:p-4 ${bgColor} rounded-lg border-l-4 ${priorityColor}`}
//                         >
//                           <h3 className="text-sm sm:text-base font-medium text-gray-900">{notice.title}</h3>
//                           <p className="text-sm text-gray-800 mt-1">{notice.content}</p>
//                           <div className="flex items-center justify-between mt-2">
//                             <p className="text-xs sm:text-sm text-gray-500">Posted on {formatDate(notice.notice_date)}</p>
//                             <span className="text-xs px-2 py-1 rounded bg-white text-gray-700">{notice.category}</span>
//                           </div>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 ) : (
//                   <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
//                     <p className="text-sm sm:text-base text-gray-600">No notices available.</p>
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Calendar Section */}
//             <div className="md:col-span-1">
//               <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
//                 <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">Calendar</h2>
//                 <Calendar />
//               </div>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default Stats;

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ResponsiveContainer from '../components/ResponsiveContainer';
import ResponsiveText from '../components/ResponsiveText';
import { useAuth } from '../context/AuthContext';
import Calendar from '../components/calender';

interface Notice {
  id: number;
  title: string;
  content: string;
  notice_date: string;
  category: string;
  priority: string;
  user_email?: string;
}

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  notices: Notice[];
}

interface ProfileData {
  institute_name: string;
  address: string;
  logo: string | null;
}

// Format date to show only date (e.g., "Jan 1, 2025")
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

// Cache object to persist data
const dataCache = {
  notices: null as Notice[] | null,
  lastFetchTime: 0,
  totalStudents: 0,
  totalTeachers: 0,
  totalClasses: 0,
  instituteName: null as string | null,
  profileLastFetchTime: 0,
  lastUserEmail: null as string | null, // Track last user email
};

// Function to reset cache (e.g., on logout or user change)
const resetCache = () => {
  dataCache.notices = null;
  dataCache.lastFetchTime = 0;
  dataCache.totalStudents = 0;
  dataCache.totalTeachers = 0;
  dataCache.totalClasses = 0;
  dataCache.instituteName = null;
  dataCache.profileLastFetchTime = 0;
  dataCache.lastUserEmail = null;
};

const Stats = () => {
  const { user } = useAuth();
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: dataCache.totalStudents || 0,
    totalTeachers: dataCache.totalTeachers || 0,
    totalClasses: dataCache.totalClasses || 0,
    notices: dataCache.notices || [],
  });
  const [instituteName, setInstituteName] = useState<string>(dataCache.instituteName || '');
  const [loading, setLoading] = useState(dataCache.notices === null);
  const [error, setError] = useState<string | null>(null);

  // Fetch institute profile
  const fetchInstituteProfile = async () => {
    if (!user?.email) return;

    const now = Date.now();
    const profileCacheAge = now - dataCache.profileLastFetchTime;
    const isProfileCacheValid = dataCache.instituteName && profileCacheAge < 600000 && dataCache.lastUserEmail === user.email;

    if (isProfileCacheValid) {
      setInstituteName(dataCache.instituteName || '');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found for profile fetch');
        return;
      }

      const response = await fetch(`${baseUrl}/api/profile`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.institute_name) {
          const instituteNameValue = data.data.institute_name;
          dataCache.instituteName = instituteNameValue;
          dataCache.profileLastFetchTime = now;
          dataCache.lastUserEmail = user.email;
          setInstituteName(instituteNameValue);
        } else {
          dataCache.instituteName = '';
          dataCache.profileLastFetchTime = now;
          dataCache.lastUserEmail = user.email;
          setInstituteName('');
        }
      } else if (response.status === 404) {
        console.log('Profile not found, using default welcome message');
        dataCache.instituteName = '';
        dataCache.profileLastFetchTime = now;
        dataCache.lastUserEmail = user.email;
        setInstituteName('');
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        resetCache();
        router.push('/login');
      } else {
        console.warn('Failed to fetch profile:', response.status);
      }
    } catch (error) {
      console.error('Error fetching institute profile:', error);
    }
  };

  // Fetch notices
  const fetchNotices = async () => {
    if (!user) return;

    const now = Date.now();
    const cacheAge = now - dataCache.lastFetchTime;
    const isCacheValid = dataCache.notices !== null && cacheAge < 60000 && dataCache.lastUserEmail === user.email;

    if (isCacheValid) {
      setStats((prev) => ({
        ...prev,
        notices: dataCache.notices || [],
      }));
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found. Please log in.');
      }

      const response = await fetch(`${baseUrl}/api/notices`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          resetCache();
          router.push('/login');
          return;
        }
        throw new Error(`Failed to fetch notices: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        dataCache.notices = data.data;
        dataCache.lastFetchTime = now;
        dataCache.lastUserEmail = user.email;
        setStats((prev) => ({
          ...prev,
          notices: data.data,
        }));
      } else {
        dataCache.notices = [];
        dataCache.lastFetchTime = now;
        dataCache.lastUserEmail = user.email;
        setStats((prev) => ({
          ...prev,
          notices: [],
        }));
      }
    } catch (error) {
      console.error('Error fetching notices:', error);
      setError('Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in.');
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const [studentResponse, teacherResponse, classesResponse] = await Promise.all([
        fetch(`${baseUrl}/api/api/students/count?user_email=${encodeURIComponent(user.email)}`, { headers }),
        fetch(`${baseUrl}/api/api/teachers/count?user_email=${encodeURIComponent(user.email)}`, { headers }),
        fetch(`${baseUrl}/api/count`, { headers }),
      ]);

      if (!studentResponse.ok || !teacherResponse.ok) {
        throw new Error('Failed to fetch counts');
      }

      const studentData = await studentResponse.json();
      const teacherData = await teacherResponse.json();
      const classesData = classesResponse.ok ? await classesResponse.json() : { totalClasses: 0 };

      dataCache.totalStudents = studentData.totalStudents || 0;
      dataCache.totalTeachers = teacherData.totalTeachers || 0;
      dataCache.totalClasses = classesData.totalClasses || 0;
      dataCache.lastFetchTime = Date.now();

      setStats({
        totalStudents: dataCache.totalStudents,
        totalTeachers: dataCache.totalTeachers,
        totalClasses: dataCache.totalClasses,
        notices: dataCache.notices || [],
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Effect to handle data fetching and cache reset
  useEffect(() => {
    if (!user) {
      resetCache();
      setInstituteName('');
      setStats({
        totalStudents: 0,
        totalTeachers: 0,
        totalClasses: 0,
        notices: [],
      });
      return;
    }

    if (user.email !== dataCache.lastUserEmail) {
      resetCache();
      dataCache.lastUserEmail = user.email;
    }

    fetchInstituteProfile();
    fetchDashboardData();
    fetchNotices();

    const pollingIntervalId = setInterval(() => {
      fetchNotices();
    }, 30000);

    return () => clearInterval(pollingIntervalId);
  }, [user]);

  if (error) {
    return (
      <div className="w-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <div className="ml-auto">
              <button
                onClick={fetchDashboardData}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-3 text-gray-600">Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {instituteName ? `Welcome to ${instituteName}` : 'Welcome Dashboard'}
            </h1>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-700">Total Students</h2>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.totalStudents}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-700">Total Teachers</h2>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.totalTeachers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow sm:col-span-2 md:col-span-1">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M4 5l4-2 4 2m6 0l4-2 4 2m-2 6h-2m-2-4h-2m-6-2H6m2 6H4"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-700">Total Classes</h2>
                  <p className="text-xl sm:text-2xl font-bold text-orange-600">{stats.totalClasses}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Notices Section */}
            <div className="md:col-span-2">
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-700">Notices</h2>
                  </div>
                  <button 
                    onClick={() => fetchNotices()}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                    disabled={loading}
                    title="Refresh notices"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Refreshing...
                      </>
                    ) : (
                      <>Refresh</>
                    )}
                  </button>
                </div>
                {loading && stats.notices.length === 0 ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-red-500"></div>
                    <p className="ml-3 text-gray-600 text-sm">Loading notices...</p>
                  </div>
                ) : stats.notices && stats.notices.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4 max-h-[400px] overflow-y-auto pr-1">
                    {stats.notices.map((notice, index) => {
                      let priorityColor = 'border-gray-400';
                      let bgColor = 'bg-gray-50';
                      if (notice.priority === 'high') {
                        priorityColor = 'border-red-400';
                        bgColor = 'bg-red-50';
                      } else if (notice.priority === 'medium') {
                        priorityColor = 'border-yellow-400';
                        bgColor = 'bg-yellow-50';
                      } else if (notice.priority === 'low') {
                        priorityColor = 'border-green-400';
                        bgColor = 'bg-green-50';
                      }
                      return (
                        <div 
                          key={notice.id || index} 
                          className={`p-3 sm:p-4 ${bgColor} rounded-lg border-l-4 ${priorityColor}`}
                        >
                          <h3 className="text-sm sm:text-base font-medium text-gray-900">{notice.title}</h3>
                          <p className="text-sm text-gray-800 mt-1">{notice.content}</p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs sm:text-sm text-gray-500">Posted on {formatDate(notice.notice_date)}</p>
                            <span className="text-xs px-2 py-1 rounded bg-white text-gray-700">{notice.category}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm sm:text-base text-gray-600">No notices available.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Calendar Section */}
            <div className="md:col-span-1">
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
                <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">Calendar</h2>
                <Calendar />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Stats;