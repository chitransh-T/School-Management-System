"use client";
import React, { useState } from 'react';
import { Bell, Home, Settings, User, LogOut, ChevronDown, Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link'; // Import Link from next/link

// Define the structure for navigation links
interface NavLink {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>; // Optional icon for the link
}

// Define the structure for profile dropdown options
interface ProfileOption {
  label: string;
  href?: string; // Make href optional since logout doesn't need it
  icon: React.ComponentType<{ className?: string }>; // Icon for the dropdown option
  onClick?: () => void; // Optional click handler
}

// Navigation links array


const DashboardNavbar: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false); // State for dropdown visibility
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const { logout } = useAuth();
  const router = useRouter();

  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Handle logout
  const handleLogout = () => {
    logout(); // Update authentication state
    router.push('/'); // Redirect to landing page
  };

  // Profile dropdown options array
  const profileOptions: ProfileOption[] = [
    { label: 'Profile', href: '/profile', icon: User },
    { label: 'Settings', href: '/settings', icon: Settings },
    { label: 'Logout', icon: LogOut, onClick: handleLogout }, // Add onClick for logout
  ];

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            {/* Replace the text with your logo image */}
            <img
              src="https://almanet.in/wp-content/uploads/2022/03/Almanet-logo-220x47-1.png" // Update this path to your logo's location
              alt="Logo"
              className="h-6 sm:h-7 md:h-8 w-auto" // Adjust height and width as needed
            />
          </Link>

          {/* Desktop Navigation Links */}
          
                {/* Render the icon if it exists */}
               
          

          {/* Desktop Profile Dropdown */}
          <div className="hidden md:block relative">
            <button
              onClick={toggleDropdown}
              className="flex items-center space-x-1 lg:space-x-2 text-gray-700 hover:text-blue-600 focus:outline-none"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
              {/* User avatar */}
              <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-4 h-4 lg:w-5 lg:h-5" />
              </div>
              <ChevronDown className="w-3 h-3 lg:w-4 lg:h-4" />
            </button>

            {/* Dropdown menu */}
            {isDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-40 sm:w-48 bg-white rounded-md shadow-lg py-1 z-10"
                role="menu"
                aria-orientation="vertical"
              >
                {profileOptions.map((option) => (
                  <div
                    key={option.label}
                    onClick={option.onClick} // Handle click events
                    className="flex items-center px-3 sm:px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                    role="menuitem"
                  >
                    <option.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                    <span>{option.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-1.5 sm:p-2 text-gray-700 hover:text-blue-600 focus:outline-none"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={20} className="sm:w-5 sm:h-5" /> : <Menu size={20} className="sm:w-5 sm:h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            {/* Mobile Navigation Links */}
           

            {/* Mobile Profile Options */}
            <div className="border-t border-gray-200 pt-3 pb-3">
              {profileOptions.map((option) => (
                <div
                  key={option.label}
                  onClick={() => {
                    if (option.onClick) option.onClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  <option.icon className="w-4 h-4 mr-3" />
                  <span>{option.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default DashboardNavbar;
