

'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import Link from "next/link";

export const LandingNavbar: React.FC = () => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect for navbar shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Function to scroll to FutureVisionSection
  const scrollToFutureVision = () => {
    const futureVisionSection = document.getElementById('future-vision');
    if (futureVisionSection) {
      futureVisionSection.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false); // Close mobile menu if open
  };

  return (
    <header
      className={`w-full fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white ${
        isScrolled ? "shadow-md border-b border-blue-200" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-1">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-1 z-10">
            <img
              src="/logo.jpg"
              alt="AlmaNet Logo"
              className="h-12 w-auto rounded-full"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center justify-center flex-1 space-x-6 text-xs font-bold text-blue-800">
            <Link
              href="/"
              className="hover:text-blue-600 transition-colors duration-200"
            >
              Home
            </Link>
            <Link
              href="/quicklinks/about-us"
              className="hover:text-blue-600 transition-colors duration-200"
            >
              About Us
            </Link>
            <Link
              href="#future-vision"
              className="hover:text-blue-600 transition-colors duration-200"
              onClick={scrollToFutureVision}
            >
              Contact Us
            </Link>
          </nav>

          {/* Desktop Button */}
          <div className="hidden md:flex items-center space-x-2">
            <button
              onClick={() => router.push("/auth/signin")}
              className="px-4 py-1 text-xs font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all duration-200 shadow-md"
            >
              Sign In
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`md:hidden p-1 rounded-full transition-colors ${
              isScrolled
                ? "text-blue-700 hover:text-blue-600"
                : "text-blue-800 hover:text-blue-600"
            }`}
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-blue-200 absolute left-0 right-0 shadow-lg rounded-b-lg">
            <nav className="px-3 py-1">
              <Link
                href="/"
                className="block py-1.5 text-blue-800 hover:text-blue-600 font-bold transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/quicklinks/about-us"
                className="block py-1.5 text-blue-800 hover:text-blue-600 font-bold transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                About Us
              </Link>
              <Link
                href="#future-vision"
                className="block py-1.5 text-blue-800 hover:text-blue-600 font-bold transition-colors duration-200"
                onClick={scrollToFutureVision}
              >
                Contact Us
              </Link>
              <div className="border-t border-blue-200 my-0.5"></div>
              <button
                className="w-full py-1.5 px-3 mt-0.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 font-bold transition-all duration-200"
                onClick={() => {
                  router.push("/auth/signin");
                  setIsMenuOpen(false);
                }}
              >
                Sign In
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Custom Scroll Behavior */}
      <style>{`
        html {
          scroll-behavior: smooth;
          --scroll-duration: 1500ms; /* Slower scroll duration */
        }
      `}</style>
    </header>
  );
};