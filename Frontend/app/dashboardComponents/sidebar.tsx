"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useResponsive } from '../hooks/useResponsive';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isStudentOpen, setIsStudentOpen] = useState(true);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const pathname = usePathname();
  const { isMobile } = useResponsive();

  const isStudentRoute = pathname?.includes('student');
  const isAttendanceRoute = pathname?.includes('attendance');

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

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsStudentOpen(true);
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
        className={`${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} 
                   ${isOpen ? 'w-64' : 'w-0 md:w-16'} 
                   fixed md:relative bg-gray-100 text-gray-800 p-4 transition-all duration-300 ease-in-out 
                   shadow-lg border-r border-gray-200 min-h-screen z-30 overflow-hidden`}
      >
        <div className="flex justify-between items-center mb-6">
          {isOpen && <div className="text-lg font-bold">Admin Dashboard</div>}
          
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
                      <Link href="/addstudent" className="hover:text-gray-600 flex items-center w-full">
                        <span className="text-sm">Add New Student</span>
                      </Link>
                    </div>
                  </li>
                  <li>
                    <div className={`p-2 hover:bg-gray-200 rounded-md ${pathname === '/studentdetails' ? 'bg-gray-200' : ''}`}>
                      <Link href="/studentdetails" className="hover:text-gray-600 flex items-center w-full">
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
                            <span className="text-sm"> - Mark Student Attendance</span>
                          </Link>
                        </div>
                      </li>
                      <li>
                        <div className={`p-2 hover:bg-gray-200 rounded-md ${pathname === '/studentattendance/attendancereport ' ? 'bg-gray-200' : ''}`}>
                          <Link href="/studentattendance/attendancereport" className="hover:text-gray-600 flex items-center w-full">
                            <span className="text-sm"> - Student Attendance Reports</span>
                          </Link>
                        </div>
                      </li>
                      
                    </ul>
                  </li>
                  
                  <li>
                    <div className={`p-2 hover:bg-gray-200 rounded-md ${pathname === '/student/reports' ? 'bg-gray-200' : ''}`}>
                      <Link href="/transfercertificate" className="hover:text-gray-600 flex items-center w-full">
                        <span className="text-sm">Transfer Certificate</span>
                      </Link>
                    </div>
                  </li>

                </ul>
                
              )}
            </li>
            <li className="mb-4">
              <Link href="/teacher" className="hover:text-gray-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                Teachers
              </Link>
            </li>
            <li className="mb-4">
              <Link href="/classes" className="hover:text-gray-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                Classes
              </Link>
            </li>
            <li className="mb-4">
              <Link href="/subjects" className="hover:text-gray-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                Subjects
              </Link>
            </li>
            <li className="mb-4">
              <Link href="/parents" className="hover:text-gray-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                </svg>
                Parents
              </Link>
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