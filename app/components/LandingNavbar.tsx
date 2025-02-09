"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

export const LandingNavbar: React.FC = () => {
  const router = useRouter();

  return (
    <header className="bg-white text-white shadow-md w-full fixed top-0 left-0 right-0 z-50">
      <div className="flex justify-between items-center py-4 px-6 max-w-screen-xl mx-auto">
        {/* Logo */}
        <div className="text-2xl font-bold">
          <a href="#" className="hover:text-gray-400">
            <img
              src="https://almanet.in/wp-content/uploads/2022/03/Almanet-logo-220x47-1.png"
              alt="Company Logo"
              className="h-8"
            />
          </a>
        </div>

        {/* Buttons */}
        <div className="flex space-x-4">
          <button
            className="bg-blue-500 text-white py-2 px-4 border border-white rounded-md hover:bg-blue-600 hover:text-gray-800 transition duration-300"
            onClick={() => router.push('/auth/signin')}
          >
            Login
          </button>
          <button
            className="bg-blue-500 py-2 px-4 rounded-md hover:bg-blue-600 hover:text-gray-800 transition duration-300"
            onClick={() => router.push('/auth/signup')}
          >
            Signup
          </button>
        </div>
      </div>
    </header>
  );
};
