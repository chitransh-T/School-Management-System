"use client";
import React, { useState, useEffect } from 'react';
import Sidebar from './sidebar';
import { useResponsive } from '../hooks/useResponsive';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { isMobile } = useResponsive();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  // Update sidebar state when screen size changes
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  return (
    <div className='flex flex-col min-h-screen pt-16 relative'>
      <Sidebar onToggle={setSidebarOpen} />
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-16'} p-4 md:p-6 lg:p-8 overflow-auto`}
      >
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
