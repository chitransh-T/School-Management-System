

// 'use client';
// import React, { useState, useEffect } from 'react';
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

// // Format date to a more readable format
// const formatDate = (dateString: string) => {
//   if (!dateString) return 'N/A';
  
//   try {
//     const date = new Date(dateString);
    
//     // Check if date is valid
//     if (isNaN(date.getTime())) {
//       return dateString; // Return original string if invalid date
//     }
    
//     // Format as: "Jan 1, 2023 at 2:30 PM"
//     return new Intl.DateTimeFormat('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     }).format(date);
//   } catch (error) {
//     console.error('Error formatting date:', error);
//     return dateString; // Return original string on error
//   }
// };

// // Create a cache object outside of the component to persist between renders
// const dataCache = {
//   notices: null as Notice[] | null,
//   lastFetchTime: 0,
//   totalStudents: 0,
//   totalTeachers: 0,
//   totalClasses: 0
// };

// const Stats = () => {
//   const { user } = useAuth();
//   const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
//   const [stats, setStats] = useState<DashboardStats>({
//     totalStudents: dataCache.totalStudents || 0,
//     totalTeachers: dataCache.totalTeachers || 0,
//     totalClasses: dataCache.totalClasses || 0,
//     notices: dataCache.notices || []
//   });
//   const [loading, setLoading] = useState(dataCache.notices === null);
//   const [noticesLoading, setNoticesLoading] = useState(dataCache.notices === null);
//   const [error, setError] = useState<string | null>(null);
//   const [dataInitialized, setDataInitialized] = useState(false);

//   useEffect(() => {
//     const fetchDashboardData = async () => {
//       if (!user?.email) {
//         setLoading(false);
//         return;
//       }
      
//       try {
//         setLoading(true);
//         setError(null);
        
//         const token = localStorage.getItem('token');
        
//         if (!token) {
//           throw new Error('Authentication token not found. Please log in.');
//         }

//         // Prepare headers for API requests
//         const headers = {
//           'Authorization': token, // Using token directly as in Flutter code
//           'Content-Type': 'application/json'
//         };
        
//         // Fetch student count - matching Flutter API endpoint
//         const studentCountResponse = await fetch(
//           `${baseUrl}/api/api/students/count?user_email=${encodeURIComponent(user.email)}`,
//           { headers }
//         );
        
//         // Fetch teacher count - matching Flutter API endpoint
//         const teacherCountResponse = await fetch(
//           `${baseUrl}/api/api/teachers/count?user_email=${encodeURIComponent(user.email)}`,
//           { headers }
//         );
        
//         // Fetch classes count (you might need to add this endpoint to your backend)
//         const classesCountResponse = await fetch(
//           `${baseUrl}/api/api/classes/count?user_email=${encodeURIComponent(user.email)}`,
//           { headers }
//         );
        
//         // Check if all responses are successful
//         if (!studentCountResponse.ok) {
//           throw new Error(`Failed to fetch student count: ${studentCountResponse.status}`);
//         }
        
//         if (!teacherCountResponse.ok) {
//           throw new Error(`Failed to fetch teacher count: ${teacherCountResponse.status}`);
//         }
        
//         // Parse responses
//         const studentData = await studentCountResponse.json();
//         const teacherData = await teacherCountResponse.json();
        
//         let classesCount = 0;
//         if (classesCountResponse.ok) {
//           const classesData = await classesCountResponse.json();
//           classesCount = classesData.totalClasses || 0;
//         }
        
//         // Update stats with the fetched data - matching Flutter structure
//         setStats({
//           totalStudents: studentData.totalStudents || 0,
//           totalTeachers: teacherData.totalTeachers || 0,
//           totalClasses: classesCount,
//           notices: []
//         });
        
//       } catch (error) {
//         console.error('Error fetching dashboard data:', error);
//         setError(error instanceof Error ? error.message : 'Failed to fetch dashboard data');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchDashboardData();
//   }, [user?.email]);

//   // Function to refresh counts (similar to Flutter's _fetchCounts)
//   const refreshCounts = async () => {
//     if (!user) return;

//     // Check if we have cached data that's recent (less than 5 minutes old)
//     const now = Date.now();
//     const cacheAge = now - dataCache.lastFetchTime;
//     const isCacheValid = dataCache.totalStudents > 0 && cacheAge < 300000; // 5 minutes
    
//     // If we have valid cached data, use it
//     if (isCacheValid) {
//       setStats(prev => ({
//         ...prev,
//         totalStudents: dataCache.totalStudents,
//         totalTeachers: dataCache.totalTeachers,
//         totalClasses: dataCache.totalClasses
//       }));
//       setLoading(false);
//       return;
//     }

//     try {
//       setLoading(true);
//       const token = localStorage.getItem('token');
      
//       if (!token) {
//         throw new Error('No token found. Please log in.');
//       }

//       const headers = {
//         'Authorization': token,
//         'Content-Type': 'application/json'
//       };

//       const [studentResponse, teacherResponse] = await Promise.all([
//         fetch(`${baseUrl}/api/api/students/count?user_email=${encodeURIComponent(user.email)}`, { headers }),
//         fetch(`${baseUrl}/api/api/teachers/count?user_email=${encodeURIComponent(user.email)}`, { headers })
//       ]);

//       if (studentResponse.ok && teacherResponse.ok) {
//         const studentData = await studentResponse.json();
//         const teacherData = await teacherResponse.json();

//         // Update cache
//         dataCache.totalStudents = studentData.totalStudents || 0;
//         dataCache.totalTeachers = teacherData.totalTeachers || 0;
//         dataCache.lastFetchTime = now;

//         // Update state
//         setStats(prev => ({
//           ...prev,
//           totalStudents: dataCache.totalStudents,
//           totalTeachers: dataCache.totalTeachers
//         }));
//       }
//     } catch (error) {
//       console.error('Error refreshing counts:', error);
//       setError('Failed to refresh counts');
//     } finally {
//       setLoading(false);
//     }
//   };

// // Fetch notices from the backend API with priority loading and caching
//   const fetchNotices = async (priority = false, forceRefresh = false) => {
//     if (!user) return;
    
//     // Check if we have cached data and it's recent (less than 1 minute old)
//     const now = Date.now();
//     const cacheAge = now - dataCache.lastFetchTime;
//     const isCacheValid = dataCache.notices !== null && cacheAge < 60000; // 1 minute
    
//     // If we have valid cached data and this isn't a forced refresh, use the cache
//     if (isCacheValid && !forceRefresh && !priority) {
//       if (!dataInitialized) {
//         setStats(prev => ({
//           ...prev,
//           notices: dataCache.notices || []
//         }));
//         setDataInitialized(true);
//       }
//       return;
//     }
    
//     try {
//       // Only show loading indicator for initial loads when no cache exists
//       if ((dataCache.notices === null || priority) && !dataInitialized) {
//         setNoticesLoading(true);
//       }
      
//       const token = localStorage.getItem('token');
      
//       if (!token) {
//         throw new Error('No token found. Please log in.');
//         return;
//       }
      
//       // Use AbortController to handle timeouts
//       const controller = new AbortController();
//       const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
//       try {
//         const response = await fetch(`${baseUrl}/api/notices`, {
//           method: 'GET',
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//           },
//           // Prevent caching to ensure fresh data
//           cache: 'no-store',
//           // Use signal for timeout
//           signal: controller.signal
//         });
        
//         clearTimeout(timeoutId);
        
//         if (!response.ok) {
//           if (response.status === 401) {
//             throw new Error('Session expired. Please login again.');
//           }
//           throw new Error(`Failed to fetch notices: ${response.status}`);
//         }
        
//         const data = await response.json();
        
//         if (data.success && Array.isArray(data.data)) {
//           // Update the cache
//           dataCache.notices = data.data;
//           dataCache.lastFetchTime = now;
          
//           // Update component state
//           setStats(prev => ({
//             ...prev,
//             notices: data.data
//           }));
//         } else {
//           // If no notices or invalid format, set empty array
//           dataCache.notices = [];
//           dataCache.lastFetchTime = now;
          
//           setStats(prev => ({
//             ...prev,
//             notices: []
//           }));
//         }
//       } catch (fetchError) {
//         // Type guard to check if fetchError is an Error object with a name property
//         if (fetchError instanceof Error) {
//           if (fetchError.name === 'AbortError') {
//             console.warn('Notice fetch timed out');
//           } else {
//             throw fetchError;
//           }
//         } else {
//           // If it's not an Error object, just throw it as is
//           throw fetchError;
//         }
//       }
//     } catch (error) {
//       console.error('Error fetching notices:', error);
//       setError('Failed to load notices');
//     } finally {
//       setNoticesLoading(false);
//     }
//   };

//  // Initial data loading when component mounts
//   useEffect(() => {
//     if (user) {
//       // Check if we need to fetch data or can use cache
//       const now = Date.now();
//       const cacheAge = now - dataCache.lastFetchTime;
//       const shouldFetchFresh = dataCache.notices === null || cacheAge > 300000; // 5 minutes
      
//       // If cache is stale or doesn't exist, fetch fresh data
//       if (shouldFetchFresh) {
//         // Load notices (will use cache if available and recent)
//         fetchNotices(true, false);
        
//         // Load other stats in parallel
//         refreshCounts();
//       } else {
//         // Use cached data and mark as initialized
//         setStats(prev => ({
//           ...prev,
//           notices: dataCache.notices || [],
//           totalStudents: dataCache.totalStudents,
//           totalTeachers: dataCache.totalTeachers,
//           totalClasses: dataCache.totalClasses
//         }));
//         setLoading(false);
//         setNoticesLoading(false);
//         setDataInitialized(true);
//       }
//     }
//   }, [user]);
  
//   // Set up polling for notices with improved performance
//   useEffect(() => {
//     if (!user || !dataInitialized) return;
    
//     // Only set up polling if we've already initialized data
//     // This prevents duplicate fetching
//     const pollingIntervalId = setInterval(() => {
//       // Background refresh without showing loading indicators
//       fetchNotices(false, true);
//     }, 30000); // 30 seconds - reduced frequency to minimize API calls
    
//    // Clean up interval on unmount
//     return () => {
//       clearInterval(pollingIntervalId);
//     };
//   }, [user, dataInitialized]);

//   if (error) {
//     return (
//       <div className="w-full">
//         <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
//           <div className="flex items-center">
//             <div className="flex-shrink-0">
//               <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
//                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//               </svg>
//             </div>
//             <div className="ml-3">
//               <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
//               <p className="text-sm text-red-700 mt-1">{error}</p>
//             </div>
//             <div className="ml-auto">
//               <button
//                 onClick={refreshCounts}
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
//           {/* Header with refresh button */}
//           <div className="flex justify-between items-center mb-6">
//             <h1 className="text-2xl font-bold text-gray-900">Welcome  Dashboard</h1>
           
//           </div>

//           {/* Stats Cards */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
//             <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
//               <div className="flex items-center">
//                 <div className="p-2 bg-blue-100 rounded-lg">
//                   <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
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
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M4 5l4-2 4 2m6 0l4-2 4 2m-2 6h-2m-2-4h-2m-6-2H6m2 6H4" />
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
//                     disabled={noticesLoading}
//                     title="Refresh notices"
//                   >
//                     {noticesLoading ? (
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
//                 {noticesLoading && stats.notices.length === 0 ? (
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
            
//             {/* Right Column - Calendar */}
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

// Format date to a more readable format
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString; // Return original string if invalid date
    }
    
    // Format as: "Jan 1, 2023 at 2:30 PM"
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString; // Return original string on error
  }
};

// Create a cache object outside of the component to persist between renders
const dataCache = {
  notices: null as Notice[] | null,
  lastFetchTime: 0,
  totalStudents: 0,
  totalTeachers: 0,
  totalClasses: 0,
  instituteName: null as string | null,
  profileLastFetchTime: 0
};

const Stats = () => {
  const { user } = useAuth();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: dataCache.totalStudents || 0,
    totalTeachers: dataCache.totalTeachers || 0,
    totalClasses: dataCache.totalClasses || 0,
    notices: dataCache.notices || []
  });
  const [instituteName, setInstituteName] = useState<string>(dataCache.instituteName || '');
  const [loading, setLoading] = useState(dataCache.notices === null);
  const [noticesLoading, setNoticesLoading] = useState(dataCache.notices === null);
  const [error, setError] = useState<string | null>(null);
  const [dataInitialized, setDataInitialized] = useState(false);

  // Function to fetch institute profile
  const fetchInstituteProfile = async () => {
    if (!user?.email) return;
    
    // Check if we have cached profile data that's recent (less than 10 minutes old)
    const now = Date.now();
    const profileCacheAge = now - dataCache.profileLastFetchTime;
    const isProfileCacheValid = dataCache.instituteName && profileCacheAge < 600000; // 10 minutes
    
    // if (isProfileCacheValid) {
    //   setInstituteName(dataCache.instituteName);
    //   return;
    // }
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('No token found for profile fetch');
        return;
      }
      
      const response = await fetch(`${baseUrl}/api/profile/${encodeURIComponent(user.email)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data?.institute_name) {
          const instituteNameValue = data.data.institute_name;
          
          // Update cache
          dataCache.instituteName = instituteNameValue;
          dataCache.profileLastFetchTime = now;
          
          // Update component state
          setInstituteName(instituteNameValue);
        }
      } else if (response.status === 404) {
        // Profile not found - this is okay, just use default welcome message
        console.log('Profile not found, using default welcome message');
      } else {
        console.warn('Failed to fetch profile:', response.status);
      }
    } catch (error) {
      console.error('Error fetching institute profile:', error);
      // Don't set error state for profile fetch failures, just log them
    }
  };

  useEffect(() => {
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

        // Prepare headers for API requests
        const headers = {
          'Authorization': token, // Using token directly as in Flutter code
          'Content-Type': 'application/json'
        };
        
        // Fetch student count - matching Flutter API endpoint
        const studentCountResponse = await fetch(
          `${baseUrl}/api/api/students/count?user_email=${encodeURIComponent(user.email)}`,
          { headers }
        );
        
        // Fetch teacher count - matching Flutter API endpoint
        const teacherCountResponse = await fetch(
          `${baseUrl}/api/api/teachers/count?user_email=${encodeURIComponent(user.email)}`,
          { headers }
        );
        
        // Fetch classes count (you might need to add this endpoint to your backend)
        const classesCountResponse = await fetch(
          `${baseUrl}/api/api/classes/count?user_email=${encodeURIComponent(user.email)}`,
          { headers }
        );
        
        // Check if all responses are successful
        if (!studentCountResponse.ok) {
          throw new Error(`Failed to fetch student count: ${studentCountResponse.status}`);
        }
        
        if (!teacherCountResponse.ok) {
          throw new Error(`Failed to fetch teacher count: ${teacherCountResponse.status}`);
        }
        
        // Parse responses
        const studentData = await studentCountResponse.json();
        const teacherData = await teacherCountResponse.json();
        
        let classesCount = 0;
        if (classesCountResponse.ok) {
          const classesData = await classesCountResponse.json();
          classesCount = classesData.totalClasses || 0;
        }
        
        // Update stats with the fetched data - matching Flutter structure
        setStats({
          totalStudents: studentData.totalStudents || 0,
          totalTeachers: teacherData.totalTeachers || 0,
          totalClasses: classesCount,
          notices: []
        });
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.email]);

  // Function to refresh counts (similar to Flutter's _fetchCounts)
  const refreshCounts = async () => {
    if (!user) return;

    // Check if we have cached data that's recent (less than 5 minutes old)
    const now = Date.now();
    const cacheAge = now - dataCache.lastFetchTime;
    const isCacheValid = dataCache.totalStudents > 0 && cacheAge < 300000; // 5 minutes
    
    // If we have valid cached data, use it
    if (isCacheValid) {
      setStats(prev => ({
        ...prev,
        totalStudents: dataCache.totalStudents,
        totalTeachers: dataCache.totalTeachers,
        totalClasses: dataCache.totalClasses
      }));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No token found. Please log in.');
      }

      const headers = {
        'Authorization': token,
        'Content-Type': 'application/json'
      };

      const [studentResponse, teacherResponse] = await Promise.all([
        fetch(`${baseUrl}/api/api/students/count?user_email=${encodeURIComponent(user.email)}`, { headers }),
        fetch(`${baseUrl}/api/api/teachers/count?user_email=${encodeURIComponent(user.email)}`, { headers })
      ]);

      if (studentResponse.ok && teacherResponse.ok) {
        const studentData = await studentResponse.json();
        const teacherData = await teacherResponse.json();

        // Update cache
        dataCache.totalStudents = studentData.totalStudents || 0;
        dataCache.totalTeachers = teacherData.totalTeachers || 0;
        dataCache.lastFetchTime = now;

        // Update state
        setStats(prev => ({
          ...prev,
          totalStudents: dataCache.totalStudents,
          totalTeachers: dataCache.totalTeachers
        }));
      }
    } catch (error) {
      console.error('Error refreshing counts:', error);
      setError('Failed to refresh counts');
    } finally {
      setLoading(false);
    }
  };

// Fetch notices from the backend API with priority loading and caching
  const fetchNotices = async (priority = false, forceRefresh = false) => {
    if (!user) return;
    
    // Check if we have cached data and it's recent (less than 1 minute old)
    const now = Date.now();
    const cacheAge = now - dataCache.lastFetchTime;
    const isCacheValid = dataCache.notices !== null && cacheAge < 60000; // 1 minute
    
    // If we have valid cached data and this isn't a forced refresh, use the cache
    if (isCacheValid && !forceRefresh && !priority) {
      if (!dataInitialized) {
        setStats(prev => ({
          ...prev,
          notices: dataCache.notices || []
        }));
        setDataInitialized(true);
      }
      return;
    }
    
    try {
      // Only show loading indicator for initial loads when no cache exists
      if ((dataCache.notices === null || priority) && !dataInitialized) {
        setNoticesLoading(true);
      }
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No token found. Please log in.');
        return;
      }
      
      // Use AbortController to handle timeouts
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      try {
        const response = await fetch(`${baseUrl}/api/notices`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          // Prevent caching to ensure fresh data
          cache: 'no-store',
          // Use signal for timeout
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Session expired. Please login again.');
          }
          throw new Error(`Failed to fetch notices: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          // Update the cache
          dataCache.notices = data.data;
          dataCache.lastFetchTime = now;
          
          // Update component state
          setStats(prev => ({
            ...prev,
            notices: data.data
          }));
        } else {
          // If no notices or invalid format, set empty array
          dataCache.notices = [];
          dataCache.lastFetchTime = now;
          
          setStats(prev => ({
            ...prev,
            notices: []
          }));
        }
      } catch (fetchError) {
        // Type guard to check if fetchError is an Error object with a name property
        if (fetchError instanceof Error) {
          if (fetchError.name === 'AbortError') {
            console.warn('Notice fetch timed out');
          } else {
            throw fetchError;
          }
        } else {
          // If it's not an Error object, just throw it as is
          throw fetchError;
        }
      }
    } catch (error) {
      console.error('Error fetching notices:', error);
      setError('Failed to load notices');
    } finally {
      setNoticesLoading(false);
    }
  };

 // Initial data loading when component mounts
  useEffect(() => {
    if (user) {
      // Fetch institute profile
      fetchInstituteProfile();
      
      // Check if we need to fetch data or can use cache
      const now = Date.now();
      const cacheAge = now - dataCache.lastFetchTime;
      const shouldFetchFresh = dataCache.notices === null || cacheAge > 300000; // 5 minutes
      
      // If cache is stale or doesn't exist, fetch fresh data
      if (shouldFetchFresh) {
        // Load notices (will use cache if available and recent)
        fetchNotices(true, false);
        
        // Load other stats in parallel
        refreshCounts();
      } else {
        // Use cached data and mark as initialized
        setStats(prev => ({
          ...prev,
          notices: dataCache.notices || [],
          totalStudents: dataCache.totalStudents,
          totalTeachers: dataCache.totalTeachers,
          totalClasses: dataCache.totalClasses
        }));
        setLoading(false);
        setNoticesLoading(false);
        setDataInitialized(true);
      }
    }
  }, [user]);
  
  // Set up polling for notices with improved performance
  useEffect(() => {
    if (!user || !dataInitialized) return;
    
    // Only set up polling if we've already initialized data
    // This prevents duplicate fetching
    const pollingIntervalId = setInterval(() => {
      // Background refresh without showing loading indicators
      fetchNotices(false, true);
    }, 30000); // 30 seconds - reduced frequency to minimize API calls
    
   // Clean up interval on unmount
    return () => {
      clearInterval(pollingIntervalId);
    };
  }, [user, dataInitialized]);

  if (error) {
    return (
      <div className="w-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <div className="ml-auto">
              <button
                onClick={refreshCounts}
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
          {/* Header with refresh button */}
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M4 5l4-2 4 2m6 0l4-2 4 2m-2 6h-2m-2-4h-2m-6-2H6m2 6H4" />
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
                    disabled={noticesLoading}
                    title="Refresh notices"
                  >
                    {noticesLoading ? (
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
                {noticesLoading && stats.notices.length === 0 ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-red-500"></div>
                    <p className="ml-3 text-gray-600 text-sm">Loading notices...</p>
                  </div>
                ) : stats.notices && stats.notices.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4 max-h-[400px] overflow-y-auto pr-1">
                    {stats.notices.map((notice, index) => {
                      // Determine priority color
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
            
            {/* Right Column - Calendar */}
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