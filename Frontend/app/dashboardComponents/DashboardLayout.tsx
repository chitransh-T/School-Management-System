
"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './sidebar';
import AdminSidebar from '../(admin)/adminComponent/adminsidebar';
import AdminNavbar from '../(admin)/adminComponent/adminNavbar';
import DashboardNavbar from '../components/dashboardNavbar';
import { useResponsive } from '../hooks/useResponsive';
import TeacherNavbar from '../(teacherdashboard)/teachercomponents/teacherNavbar';
import TeacherSidebar from '../(teacherdashboard)/teachercomponents/teachersidebar';
import ParentNavbar from '../(parentdashboard)/parentcomponents/parentNavbar';
import ParentSidebar from '../(parentdashboard)/parentcomponents/parentsidebar';
interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const pathname = usePathname();
  const { isMobile } = useResponsive();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userString = localStorage.getItem("user");
      if (userString) {
        try {
          const userObj = JSON.parse(userString);
          setUserRole(userObj.role); // 👈 correctly reads "principal"
        } catch (error) {
          console.error("Error parsing user from localStorage:", error);
        }
      }
      setLoading(false);
    }
  }, []);

  const renderNavbar = () => {
    if (userRole === "admin") return <AdminNavbar />;
    if (userRole === "principal") return <DashboardNavbar />;
    if (userRole === "teacher") return <TeacherNavbar />;
    if (userRole === "parents") return <ParentNavbar />;   //  parent navbar use krna hai 
    return null;
  };

  const renderSidebar = () => {
    if (userRole === "admin") return <AdminSidebar onToggle={setSidebarOpen} />;
    if (userRole === "principal") return <Sidebar onToggle={setSidebarOpen} />;
    if (userRole === "teacher") return <TeacherSidebar onToggle={setSidebarOpen} />;
    if (userRole === "parents") return <ParentSidebar onToggle={setSidebarOpen} />;   
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pt-16 relative">
      {renderSidebar()}
      {renderNavbar()}
      {/* <div className="ml-[250px] mt-2 w-1 h-1" /> */}
      {/* <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'md:ml-64' : 'md:ml-16'
        } p-4 md:p-6 lg:p-8 overflow-auto`}
      > */}
      <div
  className={`flex-1 flex flex-col transition-all duration-300 ${
    sidebarOpen ? 'md:ml-64' : 'md:ml-16'
  } p-4 md:p-6 lg:p-8 overflow-auto`}
>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;

