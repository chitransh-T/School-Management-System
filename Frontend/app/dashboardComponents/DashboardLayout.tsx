
"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './sidebar'; // Student/teacher sidebar
import AdminSidebar from '../(admin)/adminComponent/adminsidebar'; // Admin sidebar
import { useResponsive } from '../hooks/useResponsive';
import DashboardNavbar from '../components/dashboardNavbar';
interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const pathname = usePathname();
  const { isMobile } = useResponsive();

  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  // Determine which sidebar to show based on route
  const isAdmin = pathname?.startsWith('/admin'); // Example: /admin/dashboard
  const isTeacher = pathname?.startsWith('/teacher');
  const isStudent = pathname?.startsWith('/student');

  return (
    <div className="flex flex-col min-h-screen pt-16 relative">
      {/* Conditionally render correct sidebar */}
      {isAdmin ? (
        <AdminSidebar onToggle={setSidebarOpen} />
      ) : (
        <Sidebar onToggle={setSidebarOpen} />
      )}
      {/* <DashboardNavbar /> */}
      <div className="ml-[250px] mt-2 w-1 h-1" />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'md:ml-64' : 'md:ml-16'
        } p-4 md:p-6 lg:p-8 overflow-auto`}
      >
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
