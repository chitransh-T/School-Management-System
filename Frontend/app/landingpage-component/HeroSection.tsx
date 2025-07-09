'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ThreeDImageSlider } from '../Landingpage/mainPage';

export default function HeroSection() {
  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);

  // Parallax mouse-move effect for hero section
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      hero.style.setProperty('--parallax-x', `${x}%`);
      hero.style.setProperty('--parallax-y', `${y}%`);
    };
    hero.addEventListener('mousemove', handleMouseMove);
    return () => hero.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Function to scroll to FutureVisionSection
  const scrollToFutureVision = () => {
    const futureVisionSection = document.getElementById('future-vision');
    if (futureVisionSection) {
      futureVisionSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Function to navigate to AboutUs page
  const navigateToAboutUs = () => {
    router.push('/quicklinks/about-us');
  };

  return (
    <section
      ref={heroRef}
      className="relative w-full pt-32 pb-20 lg:pt-40 lg:pb-28 transition-all duration-700 ease-in-out animate-fade-in parallax-bg parallax-mouse bg-blue-50"
    >
      <div className="container mx-auto px-4">
        {/* Floating shapes */}
        <svg className="absolute left-10 top-10 w-32 h-32 opacity-30 pointer-events-none" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="50" fill="#60a5fa" />
        </svg>
        <svg className="absolute right-16 top-24 w-24 h-24 opacity-20 pointer-events-none" viewBox="0 0 100 100">
          <rect width="100" height="100" rx="30" fill="#3b82f6" />
        </svg>
        <svg className="absolute left-1/2 bottom-0 w-36 h-36 opacity-10 pointer-events-none transform -translate-x-1/2" viewBox="0 0 100 100">
          <polygon points="50,0 100,100 0,100" fill="#93c5fd" />
        </svg>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="lg:pr-16 max-w-2xl transition-transform duration-700 ease-in-out hover:scale-105">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-800 leading-tight mb-6 transition-colors duration-500">
              Elevate Your School Management
              <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-600 animate-gradient-x">
                with AlmaNet
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-8 transition-opacity duration-700 opacity-90">
              Modernize your institution with a comprehensive system, blending tradition with technology for 10,000+ users.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <button
                onClick={scrollToFutureVision}
                className="px-8 py-3 text-lg font-semibold bg-gradient-to-r from-blue-600 to-sky-600 text-white rounded-lg hover:from-blue-700 hover:to-sky-700 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-200"
              >
                Get Started
              </button>
              <button
                onClick={navigateToAboutUs}
                className="px-8 py-3 text-lg font-semibold bg-white text-blue-600 rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-200"
              >
                Learn More
              </button>
            </div>
          </div>

          <div className="w-full max-w-2xl mx-auto lg:mx-0 transition-transform duration-700 ease-in-out hover:scale-105">
            <ThreeDImageSlider />
          </div>
        </div>
      </div>
    </section>
  );
}