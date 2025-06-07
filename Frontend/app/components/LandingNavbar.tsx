"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';

export const LandingNavbar: React.FC = () => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header 
      className={`w-full fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white shadow-lg' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 md:py-6">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex-shrink-0 relative z-10"
          >
            <img
              src="https://almanet.in/wp-content/uploads/2022/03/Almanet-logo-220x47-1.png"
              alt="Company Logo"
              className="h-8 md:h-10 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
          <Link 
              href="/" 
              className={`text-sm font-semibold tracking-wide transition-colors ${
                isScrolled ? 'text-gray-600 hover:text-blue-600' : 'text-gray-800 hover:text-blue-500'
              }`}
            >
              Home
            </Link>
            <Link 
              href="/about-us" 
              className={`text-sm font-semibold tracking-wide transition-colors ${
                isScrolled ? 'text-gray-600 hover:text-blue-600' : 'text-gray-800 hover:text-blue-500'
              }`}
            >
              About Us
            </Link>
            <Link 
              href="/features" 
              className={`text-sm font-semibold tracking-wide transition-colors ${
                isScrolled ? 'text-gray-600 hover:text-blue-600' : 'text-gray-800 hover:text-blue-500'
              }`}
            >
              Features
            </Link>
            <Link 
              href="/contact" 
              className={`text-sm font-semibold tracking-wide transition-colors ${
                isScrolled ? 'text-gray-600 hover:text-blue-600' : 'text-gray-800 hover:text-blue-500'
              }`}
            >
              Contact
            </Link>
          </nav>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => router.push('/auth/signin')}
              className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className={`md:hidden p-2 rounded-lg transition-colors ${
              isScrolled
                ? 'text-gray-600 hover:text-blue-600'
                : 'text-gray-800 hover:text-blue-500'
            }`}
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 absolute left-0 right-0 shadow-lg">
            <nav className="px-4 py-2">
              <Link 
                href="/about-us"
                className="block py-3 text-gray-600 hover:text-blue-600 font-semibold tracking-wide"
                onClick={() => setIsMenuOpen(false)}
              >
                About Us
              </Link>
              <Link 
                href="/features"
                className="block py-3 text-gray-600 hover:text-blue-600 font-semibold tracking-wide"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </Link>
              <Link 
                href="/contact"
                className="block py-3 text-gray-600 hover:text-blue-600 font-semibold tracking-wide"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              <div className="border-t border-gray-100 my-2"></div>
              <button
                className="w-full py-3 text-gray-600 hover:text-blue-600 font-semibold tracking-wide text-left"
                onClick={() => {
                  router.push('/auth/signin');
                  setIsMenuOpen(false);
                }}
              >
                Sign In
              </button>
              <button
                className="w-full py-3 px-4 mt-2 mb-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-center"
                onClick={() => {
                  router.push('/auth/signup');
                  setIsMenuOpen(false);
                }}
              >
                Sign Up
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};