'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LandingNavbar } from '@/app/components/LandingNavbar';

const AboutUs = () => {
  const router = useRouter();
  const aboutRef = useRef<HTMLDivElement>(null);

  // Parallax mouse-move effect for about section
  useEffect(() => {
    const about = aboutRef.current;
    if (!about) return;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = about.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      about.style.setProperty('--parallax-x', `${x}%`);
      about.style.setProperty('--parallax-y', `${y}%`);
    };
    about.addEventListener('mousemove', handleMouseMove);
    return () => about.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div>
      <LandingNavbar />
      <div
        ref={aboutRef}
        className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-blue-50 to-slate-100 text-gray-800 pt-16 parallax-bg parallax-mouse"
      >
        <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <header className="mb-12 text-center">
            <h1 className="text-4xl font-extrabold text-gray-700 mb-4">About Us</h1>
            <p className="text-lg text-gray-600">
              Transforming Education with Innovative Technology by Almanet Professional Services
            </p>
          </header>

          <div className="bg-white shadow-lg rounded-xl p-10 leading-relaxed text-gray-600">
            {/* Mission Section */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-700 mb-6">Our Mission</h2>
              <p className="text-base">
                At Almanet Professional Services, we are dedicated to empowering educational institutions with our state-of-the-art School Management System. Our platform is designed to streamline administrative tasks, enhance teaching efficiency, and foster student success, serving thousands of users across schools and universities worldwide.
              </p>
            </section>

            {/* Features Section */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-700 mb-6">Why Choose Almanet's School Management System?</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="w-12 h-12 mb-4 bg-gradient-to-r from-blue-600 to-sky-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 2a6 6 0 110 12 6 6 0 010-12zm0 2a1 1 0 100 2 1 1 0 000-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Student Information Management</h3>
                  <p className="text-gray-600">
                    Centralize student data, including academic records, attendance, and behavior, for a comprehensive view of each student's progress.
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="w-12 h-12 mb-4 bg-gradient-to-r from-blue-600 to-sky-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm5 7a1 1 0 100-2 1 1 0 000 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Attendance & Scheduling</h3>
                  <p className="text-gray-600">
                    Automate attendance tracking and manage class schedules effortlessly to save time and reduce administrative errors.
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="w-12 h-12 mb-4 bg-gradient-to-r from-blue-600 to-sky-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm7 3a1 1 0 011 1v2h2a1 1 0 110 2h-2v2a1 1 0 11-2 0v-2H7a1 1 0 110-2h2V7a1 1 0 011-1z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Gradebook & Reporting</h3>
                  <p className="text-gray-600">
                    Simplify grade management and generate detailed reports to track student performance and institutional outcomes.
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="w-12 h-12 mb-4 bg-gradient-to-r from-blue-600 to-sky-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 6a1 1 0 011 1v4a1 1 0 11-2 0V9a1 1 0 011-1zm0-4a1 1 0 100 2 1 1 0 000-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Parent & Student Portal</h3>
                  <p className="text-gray-600">
                    Offer real-time access to grades, assignments, and announcements to keep parents and students engaged.
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="w-12 h-12 mb-4 bg-gradient-to-r from-blue-600 to-sky-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 5a3 3 0 013-3h10a3 3 0 013 3v10a3 3 0 01-3 3H5a3 3 0 01-3-3V5zm3 2a1 1 0 011-1h8a1 1 0 011 1v4H5V7zm8 2a1 1 0 011 1v2a1 1 0 11-2 0V9a1 1 0 011-1z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Communication Tools</h3>
                  <p className="text-gray-600">
                    Facilitate seamless communication between teachers, parents, and students with integrated messaging and notifications.
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="w-12 h-12 mb-4 bg-gradient-to-r from-blue-600 to-sky-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm3 4a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1H8a1 1 0 01-1-1V7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Secure & Scalable</h3>
                  <p className="text-gray-600">
                    Protect sensitive data with robust security features like two-factor authentication, built to scale for institutions of any size.
                  </p>
                </div>
              </div>
            </section>

            {/* Company Overview Section */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-700 mb-6">Who We Are</h2>
              <p className="text-base">
                Almanet Professional Services is a leading provider of innovative educational technology solutions, headquartered in India with a global presence. Our School Management System is crafted by a team of experienced educators and technologists to address the unique challenges faced by schools and universities. With a commitment to excellence, we empower institutions to modernize operations, enhance collaboration, and drive academic success through a user-friendly, secure, and scalable platform.
              </p>
            </section>

            {/* Call-to-Action Section */}
            <section className="text-center pt-6 border-t border-gray-200 mb-8">
              <h2 className="text-3xl font-bold text-gray-700 mb-4">Transform Your School's Future</h2>
              <p className="text-base text-gray-600 mb-6">
                Discover how Almanet's School Management System can transform your school's operations and enhance the educational experience.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
                <a
                  href="/quicklinks/demo"
                  className="inline-block px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transform hover:scale-105 transition-transform duration-200"
                  aria-label="Request a Demo"
                >
                  Request a Demo
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;