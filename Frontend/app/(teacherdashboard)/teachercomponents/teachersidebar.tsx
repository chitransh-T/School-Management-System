

"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useResponsive } from '../../hooks/useResponsive';

interface SidebarProps {
  onToggle?: (isOpen: boolean) => void;
}

const Sidebar = ({ onToggle }: SidebarProps = {}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isStudentOpen, setIsStudentOpen] = useState(true);
  const [isHomeworkOpen, setIsHomeworkOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [isEventOpen, setIsEventOpen] = useState(false);
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  
  const pathname = usePathname();
  const { isMobile } = useResponsive();

  const isStudentRoute = pathname?.includes('/student');
  const isHomeworkRoute = pathname?.includes('/Homework');
  const isMessageRoute = pathname?.includes('/MessagesControl');
  const isEventRoute = pathname?.includes('/eventimages');

  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [pathname, isMobile]);

  useEffect(() => {
    if (isHomeworkRoute) {
      setIsHomeworkOpen(true);
    }
  }, [pathname, isHomeworkRoute]);

  useEffect(() => {
    if (isMessageRoute) {
      setIsMessageOpen(true);
    }
  }, [pathname, isMessageRoute]);

  useEffect(() => {
    if (isEventRoute) {
      setIsEventOpen(true);
    }
  }, [pathname, isEventRoute]);
  
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

  useEffect(() => {
    const restoreScrollPosition = () => {
      const savedPosition = localStorage.getItem('sidebarScrollPosition');
      if (savedPosition && sidebarRef.current) {
        sidebarRef.current.scrollTop = parseInt(savedPosition, 10);
      }
    };

    const timeoutId = setTimeout(restoreScrollPosition, 100);
    return () => clearTimeout(timeoutId);
  }, [pathname]);

  const toggleSidebar = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (newIsOpen) {
      setIsStudentOpen(true);
    }
    if (newIsOpen) {
      setIsHomeworkOpen(true);
    }
    if (newIsOpen) {
      setIsMessageOpen(true);
    }
    if (onToggle) {
      onToggle(newIsOpen);
    }
    if (newIsOpen) {
      setIsEventOpen(true);
    }
  };

  return (
    <>
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

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

      <div
        ref={sidebarRef}
        className={`${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                   ${isOpen ? 'w-64' : 'w-0 md:w-16'}
                   fixed top-16 left-0 bottom-0 bg-gray-100 text-gray-800 p-4 transition-all duration-300 ease-in-out
                   shadow-lg border-r border-gray-200 z-20 overflow-y-auto overflow-x-hidden h-[calc(100vh-4rem)]`}
      >
        <div className="flex justify-between items-center mb-6">
          {isOpen && <div className="text-lg font-bold">Teacher Dashboard</div>}

          {isMobile ? (
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
            {/* Dashboard */}
            <li className="mb-4">
              <Link href="/teacherdashboard" className="hover:text-gray-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Dashboard
              </Link>
            </li>

            {/* Students Section */}
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
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-200 ${isStudentOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isStudentOpen && (
                <ul className="ml-6 mt-2 space-y-2">
                  <li>
                    <Link href="/attendence/markstudentattendance" className={`block p-2 rounded-md hover:bg-gray-200 ${pathname === '/attendence/markstudentattendance' ? 'bg-gray-200' : ''}`}>
                      Mark Student Attendance
                    </Link>
                  </li>
                  <li>
                    <Link href="/attendence/studattendancereport" className={`block p-2 rounded-md hover:bg-gray-200 ${pathname === '/attendence/studattendancereport' ? 'bg-gray-200' : ''}`}>
                      Attendance Reports
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            {/* Homework Section */}
            <li className="mb-4">
              <button
                onClick={() => setIsHomeworkOpen(!isHomeworkOpen)}
                className={`w-full hover:text-gray-600 flex items-center justify-between ${isHomeworkRoute ? 'text-blue-600 font-medium' : ''}`}
              >
                <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Homework
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-200 ${isHomeworkOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isHomeworkOpen && (
                <ul className="ml-6 mt-2 space-y-2">
                  <li>
                    <Link href="/Homework/givehomework" className={`block p-2 rounded-md hover:bg-gray-200 ${pathname === '/Homework/givehomework' ? 'bg-gray-200' : ''}`}>
                      Give Homework
                    </Link>
                  </li>
                  <li>
                    <Link href="/Homework/viewhomework" className={`block p-2 rounded-md hover:bg-gray-200 ${pathname === '/Homework/viewhomework' ? 'bg-gray-200' : ''}`}>
                      View Homework
                    </Link>
                  </li>
                </ul>
              )}
            </li>
         {/* message section */}
         <li className="mb-4">
              <button
                onClick={() => setIsMessageOpen(!isMessageOpen)}
                className={`w-full hover:text-gray-600 flex items-center justify-between ${isMessageRoute ? 'text-blue-600 font-medium' : ''}`}
              >
                <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Message section
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-200 ${isMessageOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isMessageOpen && (
                <ul className="ml-6 mt-2 space-y-2">
                  <li>
                    <Link href="/MessagesControl/sentmessage" className={`block p-2 rounded-md hover:bg-gray-200 ${pathname === '/MessagesControl/sentmessage' ? 'bg-gray-200' : ''}`}>
                      Send Message
                    </Link>
                  </li>
                  <li>
                    <Link href="/MessagesControl/viewmessage" className={`block p-2 rounded-md hover:bg-gray-200 ${pathname === '/MessagesControl/viewmessage' ? 'bg-gray-200' : ''}`}>
                      View Message
                    </Link>
                  </li>
                  <li>
                    <Link href="/MessagesControl/receivemessage" className={`block p-2 rounded-md hover:bg-gray-200 ${pathname === '/MessagesControl/receivemessage' ? 'bg-gray-200' : ''}`}>
                      Received Message
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            <li className="mb-4">
              <button
                onClick={() => setIsEventOpen(!isEventOpen)}
                className={`w-full hover:text-gray-600 flex items-center justify-between ${isEventRoute ? 'text-blue-600 font-medium' : ''}`}
              >
                <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h2l2-2h4l2 2h2a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V9zm6 4a3 3 0 106 0 3 3 0 00-6 0z" />
                  </svg>
                  Event Capture
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-200 ${isEventOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isEventOpen && (
                <ul className="ml-6 mt-2 space-y-2">
                  <li>
                    <Link href="/eventimages/uploadimage" className={`block p-2 rounded-md hover:bg-gray-200 ${pathname === '/eventimages/uploadimage' ? 'bg-gray-200' : ''}`}>
                      Upload Images
                    </Link>
                  </li>
                  <li>
                    <Link href="/eventimages/viewimage" className={`block p-2 rounded-md hover:bg-gray-200 ${pathname === '/eventimages/viewimage' ? 'bg-gray-200' : ''}`}>
                      View Images
                    </Link>
                  </li>
                </ul>
              )}
            </li>

          </ul>
        )}
      </div>
    </>
  );
};

export default Sidebar;
