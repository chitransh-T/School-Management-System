"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useResponsive } from '../../hooks/useResponsive';
import { useRouter } from 'next/navigation';
interface SidebarProps {
  onToggle?: (isOpen: boolean) => void;
}

const AdminSidebar = ({ onToggle }: SidebarProps = {}) => {
  const [isOpen, setIsOpen] = useState(true);
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { isMobile } = useResponsive();

  const [isSignupOpen, setIsSignupOpen] = useState(true);
  const isSignupRoute = pathname?.includes('/auth/signup');

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
    if (isSignupRoute) {
      setIsSignupOpen(true);
    }
  }, [isSignupRoute]);

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
      setIsSignupOpen(true);
    }

    if (onToggle) {
      onToggle(newIsOpen);
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
          {isOpen && <div className="text-lg font-bold">Admin Dashboard</div>}

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
            <li className="mb-4">
              <Link href="/admindashboard" className="hover:text-gray-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Admin Dashboard
              </Link>
            </li>

            <li className="mb-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSignupOpen(!isSignupOpen);
                }}
                className={`w-full hover:text-gray-600 flex items-center justify-between ${isSignupRoute ? 'text-blue-600 font-medium' : ''}`}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Signup
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 transition-transform duration-200 ${isSignupOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isSignupOpen && (
                <ul className="ml-6 mt-2 space-y-2">
                  <li>
                    <div className={`p-2 hover:bg-gray-200 rounded-md ${pathname === '/usersignup' ? 'bg-gray-200' : ''}`}>
                      <Link
                        href="/usersignup"
                        className="hover:text-gray-600 flex items-center w-full"
                        onClick={() =>
                          localStorage.setItem('sidebarScrollPosition', sidebarRef.current?.scrollTop?.toString() || '0')
                        }
                      >
                        <span className="text-sm">Add New User</span>
                      </Link>
                    </div>
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

export default AdminSidebar;
