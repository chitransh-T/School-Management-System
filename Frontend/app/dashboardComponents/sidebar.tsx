
"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useResponsive } from '../hooks/useResponsive';

interface SidebarProps {
  onToggle?: (isOpen: boolean) => void;
}

const Sidebar = ({ onToggle }: SidebarProps = {}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isStudentOpen, setIsStudentOpen] = useState(true);
  const [isTeacherOpen, setIsTeacherOpen] = useState(true);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isClassOpen, setIsClassOpen] = useState(true);
  const [isSubjectOpen, setIsSubjectOpen] = useState(true);
  const [isFeesOpen, setIsFeesOpen] = useState(false);
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const [isSessionOpen, setIsSessionOpen] = useState(true);
  const pathname = usePathname();
  const { isMobile } = useResponsive();

  const isStudentRoute = pathname?.includes('/student');
  const isTeacherRoute = pathname?.includes('/teacher');
  const isAttendanceRoute = pathname?.includes('/attendance');
  const isClassRoute = pathname?.includes('/class') || pathname?.includes('/allClasses') || pathname?.includes('/addClass');
  const isSubjectRoute = pathname?.includes('/subject') || pathname?.includes('/classeswithsubject') || pathname?.includes('/assignSubject');
  const isSessionRoute = pathname?.includes('/session') || pathname?.includes('/managesession') || pathname?.includes('/createsession');

  // Close sidebar automatically on mobile
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  }, [isMobile]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [pathname, isMobile]);
  
  // Auto-open relevant sections based on current route
  useEffect(() => {
    // Keep teacher dropdown open if on a teacher-related page
    if (isTeacherRoute) {
      setIsTeacherOpen(true);
    }
    if (isSessionRoute) {
      setIsSessionOpen(true);
    }
    
    // Keep class dropdown open if on a class-related page
    if (isClassRoute) {
      setIsClassOpen(true);
    }
  }, [pathname, isTeacherRoute, isClassRoute, isSessionRoute]);
  
  // Save scroll position to localStorage when scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (sidebarRef.current) {
        localStorage.setItem('sidebarScrollPosition', sidebarRef.current.scrollTop.toString());
      }
    };
    
    const sidebarElement = sidebarRef.current;
    if (sidebarElement) {
      sidebarElement.addEventListener('scroll', handleScroll);
      return () => {
        sidebarElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);
  
  // Restore scroll position on component mount and after navigation
  useEffect(() => {
    const restoreScrollPosition = () => {
      const savedPosition = localStorage.getItem('sidebarScrollPosition');
      if (savedPosition && sidebarRef.current) {
        sidebarRef.current.scrollTop = parseInt(savedPosition, 10);
      }
    };
    
    // Small delay to ensure DOM is fully updated
    const timeoutId = setTimeout(restoreScrollPosition, 100);
    
    return () => clearTimeout(timeoutId);
  }, [pathname]);

  const toggleSidebar = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (newIsOpen) {
      setIsStudentOpen(true);
      setIsTeacherOpen(true);
      setIsClassOpen(true);
      setIsSubjectOpen(true);
      setIsFeesOpen(true);
      setIsSessionOpen(true);
    }
    // Notify parent component about sidebar state change
    if (onToggle) {
      onToggle(newIsOpen);
    }
  };

  return (
    <>
      {/* Mobile overlay - only visible when sidebar is open on mobile */}
      {isOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile hamburger menu button - only visible when sidebar is closed on mobile */}
      {!isOpen && isMobile && (
        <button 
          onClick={toggleSidebar} 
          className="fixed top-20 left-4 z-30 p-2 bg-white rounded-md shadow-lg hover:bg-gray-100 flex items-center justify-center"
          aria-label="Open sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} 
                   ${isOpen ? 'w-64' : 'w-0 md:w-16'} 
                   fixed top-16 left-0 bottom-0 bg-gray-100 text-gray-800 p-4 transition-all duration-300 ease-in-out 
                   shadow-lg border-r border-gray-200 z-20 overflow-y-auto overflow-x-hidden h-[calc(100vh-4rem)]`}
      >
        <div className="flex justify-between items-center mb-6">
          {isOpen && <div className="text-lg font-bold">Principal Dashboard</div>}
          
          {/* Standard sidebar toggle/close button */}
          {isMobile ? (
            /* Mobile close button - positioned at the top right corner */
            <button 
              onClick={() => setIsOpen(false)} 
              className="p-2 hover:bg-gray-200 rounded-md text-gray-700 absolute top-4 right-4"
              aria-label="Close sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            /* Desktop toggle button */
            <button 
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-200 rounded-md text-gray-700"
              aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {isOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              )}
            </button>
          )}
        </div>
        
        {isOpen && (
          <ul>
            <li className="mb-4">
              <Link href="/principledashboard" className="hover:text-gray-600 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Dashboard
              </Link>
            </li>
            <li className="mb-4">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSessionOpen(!isSessionOpen);
                }}
                className={`w-full hover:text-gray-600 flex items-center justify-between ${isSessionRoute ? 'text-blue-600 font-medium' : ''}`}
              >
                <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                  Sessions
                </div>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-4 w-4 transition-transform duration-200 ${isSessionOpen ? 'transform rotate-180' : ''}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isSessionOpen && (
                <ul className="ml-6 mt-2 space-y-2">
                  <li>
                    <div className={`p-2 hover:bg-gray-200 rounded-md ${pathname === '/createsession' ? 'bg-gray-200' : ''}`}>
                      <Link href="/createsession" className="hover:text-gray-600 flex items-center w-full" onClick={() => localStorage.setItem('sidebarScrollPosition', sidebarRef.current?.scrollTop?.toString() || '0')}>
                        <span className="text-sm">Create Session</span>
                      </Link>
                    </div>
                  </li>
                  <li>
                    <div className={`p-2 hover:bg-gray-200 rounded-md ${pathname === '/managesession' ? 'bg-gray-200' : ''}`}>
                      <Link href="/managesession" className="hover:text-gray-600 flex items-center w-full">
                        <span className="text-sm">Manage Session</span>
                      </Link>
                    </div>
                  </li>
          
                </ul>
              )}
            </li>

             {/* Teacher Section */}
             <li className="mb-4">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsTeacherOpen(!isTeacherOpen);
                }}
                className={`w-full hover:text-gray-600 flex items-center justify-between ${isTeacherRoute ? 'text-blue-600 font-medium' : ''}`}
              >
                <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Teacher
                </div>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-4 w-4 transition-transform duration-200 ${isTeacherOpen ? 'transform rotate-180' : ''}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isTeacherOpen && (
                <ul className="ml-6 mt-2 space-y-2">
                  <li>
                    <div className={`p-2 hover:bg-gray-200 rounded-md ${pathname === '/addteacher' ? 'bg-gray-200' : ''}`}>
                      <Link href="/addTeacher" className="hover:text-gray-600 flex items-center w-full" onClick={() => localStorage.setItem('sidebarScrollPosition', sidebarRef.current?.scrollTop?.toString() || '0')}>
                        <span className="text-sm">Add New Teacher</span>
                      </Link>
                    </div>
                  </li>
                  <li>
                    <div className={`p-2 hover:bg-gray-200 rounded-md ${pathname === '/TeacherDetails' ? 'bg-gray-200' : ''}`}>
                      <Link href="/TeacherDetails" className="hover:text-gray-600 flex items-center w-full" onClick={() => localStorage.setItem('sidebarScrollPosition', sidebarRef.current?.scrollTop?.toString() || '0')}>
                        <span className="text-sm">View Teacher Details</span>
                      </Link>
                    </div>
                  </li>
                  <li>
                    <div className={`p-2 hover:bg-gray-200 rounded-md ${pathname?.includes('teacherabsent') ? 'bg-gray-200' : ''}`}>
                      <span className="text-sm">Teacher Attendance</span>
                    </div>
                    <ul className="ml-4 mt-2 space-y-2">
                      <li>
                        <div className={`p-2 hover:bg-gray-200 rounded-md ${pathname === '/TeacherAttendance/markteacherattendance' ? 'bg-gray-200' : ''}`}>
                          <Link href="/TeacherAttendance/markteacherattendance" className="hover:text-gray-600 flex items-center w-full">
                            <span className="text-sm"> - Mark Attendance</span>
                          </Link>
                        </div>
                      </li>
                      <li>
                        <div className={`p-2 hover:bg-gray-200 rounded-md ${pathname === '/TeacherAttendance/TeacherAttendanceReport' ? 'bg-gray-200' : ''}`}>
                          <Link href="/TeacherAttendance/TeacherAttendanceReport" className="hover:text-gray-600 flex items-center w-full">
                            <span className="text-sm"> - Attendance Reports</span>
                          </Link>
                        </div>
                      </li>
                    </ul>
                  </li>
                </ul>
              )}
            </li>

              {/* Other menu items */}
              <li className="mb-4">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsClassOpen(!isClassOpen);
                }}
                className={`w-full hover:text-gray-600 flex items-center justify-between ${isClassRoute ? 'text-blue-600 font-medium' : ''}`}
              >
                <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                  Classes
                </div>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-4 w-4 transition-transform duration-200 ${isClassOpen ? 'transform rotate-180' : ''}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isClassOpen && (
                <ul className="ml-6 mt-2 space-y-2">
                  <li>
                    <div className={`p-2 hover:bg-gray-200 rounded-md ${pathname === '/allclasses' ? 'bg-gray-200' : ''}`}>
                      <Link href="/allclasses" className="hover:text-gray-600 flex items-center w-full" onClick={() => localStorage.setItem('sidebarScrollPosition', sidebarRef.current?.scrollTop?.toString() || '0')}>
                        <span className="text-sm">All classes</span>
                      </Link>
                    </div>
                  </li>
                  <li>
                    <div className={`p-2 hover:bg-gray-200 rounded-md ${pathname === '/addclass' ? 'bg-gray-200' : ''}`}>
                      <Link href="/addclass" className="hover:text-gray-600 flex items-center w-full">
                        <span className="text-sm">New Class</span>
                      </Link>
                    </div>
                  </li>
          
                </ul>
              )}
            </li>



            <li className="mb-4">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSubjectOpen(!isSubjectOpen);
                }}
                className={`w-full hover:text-gray-600 flex items-center justify-between ${isSubjectRoute ? 'text-blue-600 font-medium' : ''}`}
              >
                <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                  Subjects
                </div>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-4 w-4 transition-transform duration-200 ${isSubjectOpen ? 'transform rotate-180' : ''}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isSubjectOpen && (
                <ul className="ml-6 mt-2 space-y-2">
                  <li>
                    <div className={`p-2 hover:bg-gray-200 rounded-md ${pathname === '/classeswithsubject' ? 'bg-gray-200' : ''}`}>
                      <Link href="/classeswithsubject" className="hover:text-gray-600 flex items-center w-full" onClick={() => localStorage.setItem('sidebarScrollPosition', sidebarRef.current?.scrollTop?.toString() || '0')}>
                        <span className="text-sm">Classes with subjects</span>
                      </Link>
                    </div>
                  </li>
                  <li>
                    <div className={`p-2 hover:bg-gray-200 rounded-md ${pathname === '/assignSubject' ? 'bg-gray-200' : ''}`}>
                      <Link href="/assignSubject" className="hover:text-gray-600 flex items-center w-full">
                        <span className="text-sm">Assign Subject</span>
                      </Link>
                    </div>
                  </li>
          
                </ul>
              )}
            </li>


            {/* Student Section */}
            <li className="mb-4">
              <button 
                onClick={() => setIsStudentOpen(!isStudentOpen)}
                className={`w-full hover:text-gray-600 flex items-center justify-between ${isStudentRoute ? 'text-blue-600 font-medium' : ''}`}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  Students
                </div>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-4 w-4 transition-transform duration-200 ${isStudentOpen ? 'transform rotate-180' : ''}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isStudentOpen && (
                <ul className="ml-6 mt-2 space-y-2">
                  
                  <li>
                    <div className={`p-2 hover:bg-gray-200 rounded-md ${pathname === '/addstudent' ? 'bg-gray-200' : ''}`}>
                      <Link href="/addstudent" className="hover:text-gray-600 flex items-center w-full" onClick={() => localStorage.setItem('sidebarScrollPosition', sidebarRef.current?.scrollTop?.toString() || '0')}>
                        <span className="text-sm">Add New Student</span>
                      </Link>
                    </div>
                  </li>
                  <li>
                    <div className={`p-2 hover:bg-gray-200 rounded-md ${pathname === '/studentdetails' ? 'bg-gray-200' : ''}`}>
                      <Link href="/studentdetails" className="hover:text-gray-600 flex items-center w-full" onClick={() => localStorage.setItem('sidebarScrollPosition', sidebarRef.current?.scrollTop?.toString() || '0')}>
                        <span className="text-sm">View Student Details</span>
                      </Link>
                    </div>
                  </li>
                  <li>
                    <div className={`p-2 hover:bg-gray-200 rounded-md ${isAttendanceRoute ? 'bg-gray-200' : ''}`}>
                      <span className="text-sm">Student Attendance</span>
                    </div>
                    <ul className="ml-4 mt-2 space-y-2">
                      <li>
                        <div className={`p-2 hover:bg-gray-200 rounded-md ${pathname === '/studentattendance/markattendance' ? 'bg-gray-200' : ''}`}>
                          <Link href="/studentattendance/markattendance" className="hover:text-gray-600 flex items-center w-full">
                            <span className="text-sm"> -  Mark  Attendance</span>
                          </Link>
                        </div>
                      </li>
                      <li>
                        <div className={`p-2 hover:bg-gray-200 rounded-md ${pathname === '/studentattendance/attendancereport' ? 'bg-gray-200' : ''}`}>
                          <Link href="/studentattendance/attendancereport" className="hover:text-gray-600 flex items-center w-full">
                            <span className="text-sm"> - Attendance Reports</span>
                          </Link>
                        </div>
                      </li>
                    </ul>
                  </li>
                  <li>
                    <div className={`p-2 hover:bg-gray-200 rounded-md ${pathname === '/studentadmission' ? 'bg-gray-200' : ''}`}>
                      <Link href="/studentadmission" className="hover:text-gray-600 flex items-center w-full">
                        <span className="text-sm">Student Admission</span>
                      </Link>
                    </div>
                  </li>
                 
                 
                </ul>
              )}
            </li>
            <li className="mb-4">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFeesOpen(!isFeesOpen);
                }}
                className={`w-full hover:text-gray-600 flex items-center justify-between ${isFeesOpen ? 'text-blue-600 font-medium' : ''}`}
              >
                <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                </svg>
                  Fees 
                </div>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-4 w-4 transition-transform duration-200 ${isFeesOpen ? 'transform rotate-180' : ''}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isFeesOpen && (
                <ul className="ml-6 mt-2 space-y-2">
                  <li>
                    <div className={`p-2 hover:bg-gray-200 rounded-md ${pathname === '/feemaster' ? 'bg-gray-200' : ''}`}>
                      <Link href="/feemaster" className="hover:text-gray-600 flex items-center w-full" onClick={() => localStorage.setItem('sidebarScrollPosition', sidebarRef.current?.scrollTop?.toString() || '0')}>
                        <span className="text-sm">Fee master</span>
                      </Link>
                    </div>
                  </li>
                  <li>
                    <div className={`p-2 hover:bg-gray-200 rounded-md ${pathname === '/collectfees' ? 'bg-gray-200' : ''}`}>
                      <Link href="/collectfees" className="hover:text-gray-600 flex items-center w-full" onClick={() => localStorage.setItem('sidebarScrollPosition', sidebarRef.current?.scrollTop?.toString() || '0')}>
                        <span className="text-sm">Collect Fees</span>
                      </Link>
                    </div>
                  </li>
          
                </ul>
              )}
            </li>

            <li className="mb-4">
              <Link href="/notice" className="hover:text-gray-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
                Notices
              </Link>
            </li>
          </ul>
        )}
      </div>
    </>
  );
};

export default Sidebar;
