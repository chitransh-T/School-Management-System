"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export const LandingNavbar: React.FC = () => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-white text-white shadow-md w-full fixed top-0 left-0 right-0 z-50">
      <div className="flex justify-between items-center py-4 px-6 max-w-screen-xl mx-auto">
        {/* Logo */}
        <div className="text-2xl font-bold">
          <a href="#" className="hover:text-gray-400">
            <img
              src="https://almanet.in/wp-content/uploads/2022/03/Almanet-logo-220x47-1.png"
              alt="Company Logo"
              className="h-6 sm:h-7 md:h-8"
            />
          </a>
        </div>

        {/* Desktop & Tablet Buttons */}
        <div className="hidden md:flex space-x-4">
          <button
            className="bg-blue-500 text-white py-2 px-4 border border-white rounded-md hover:bg-blue-600 hover:text-gray-800 transition duration-300"
            onClick={() => router.push('/auth/signin')}
          >
            Login
          </button>
          <button
            className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 hover:text-gray-800 transition duration-300"
            onClick={() => router.push('/auth/signup')}
          >
            Signup
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-blue-500 p-2"
          onClick={toggleMenu}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 px-4 py-2">
          <div className="flex flex-col space-y-2">
            <button
              className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 hover:text-gray-800 transition duration-300 w-full"
              onClick={() => {
                router.push('/auth/signin');
                setIsMenuOpen(false);
              }}
            >
              Login
            </button>
            <button
              className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 hover:text-gray-800 transition duration-300 w-full"
              onClick={() => {
                router.push('/auth/signup');
                setIsMenuOpen(false);
              }}
            >
              Signup
            </button>
          </div>
        </div>
      )}
    </header>
  );
};