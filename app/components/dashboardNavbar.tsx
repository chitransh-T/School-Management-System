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
const navLinks: NavLink[] = [
  { href: '/Admindashboard', label: 'Home', icon: Home },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About Us' },
];

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
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
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
          <div className="hidden md:flex items-center justify-center flex-1 space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="flex items-center text-gray-700 hover:text-blue-600 transition-colors"
              >
                {/* Render the icon if it exists */}
                {link.icon && <link.icon className="w-5 h-5 mr-1" />}
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Desktop Profile Dropdown */}
          <div className="hidden md:block relative">
            <button
              onClick={toggleDropdown}
              className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 focus:outline-none"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
              {/* User avatar */}
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* Dropdown menu */}
            {isDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10"
                role="menu"
                aria-orientation="vertical"
              >
                {profileOptions.map((option) => (
                  <div
                    key={option.label}
                    onClick={option.onClick} // Handle click events
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                    role="menuitem"
                  >
                    <option.icon className="w-4 h-4 mr-2" />
                    <span>{option.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 text-gray-700 hover:text-blue-600 focus:outline-none"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            {/* Mobile Navigation Links */}
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.icon && <link.icon className="w-5 h-5 mr-2" />}
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>

            {/* Mobile Profile Options */}
            <div className="border-t border-gray-200 pt-4 pb-3">
              {profileOptions.map((option) => (
                <div
                  key={option.label}
                  onClick={() => {
                    if (option.onClick) option.onClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center px-5 py-3 text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  <option.icon className="w-5 h-5 mr-3" />
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
