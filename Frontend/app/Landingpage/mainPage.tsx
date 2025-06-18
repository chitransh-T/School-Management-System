"use client";

import dynamic from 'next/dynamic';
import { CheckCircle } from 'lucide-react';
import { memo } from 'react';
import Footer from '../components/footer';
import { LandingNavbar } from '../components/LandingNavbar';
// Lazy load the slider component with a loading placeholder
const ImageSlider = dynamic(() => import("../components/sliderComponent"), {
  loading: () => (
    <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden shadow-md">
      <div className="h-44 sm:h-52 md:h-60 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  ),
  ssr: false
});

// Memoize the FeatureCard component to prevent unnecessary re-renders
const FeatureCard = memo(({ title, description }: { title: string; description: string }) => (
  <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
    <div className="flex items-start space-x-3">
      <CheckCircle className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  </div>
));

FeatureCard.displayName = 'FeatureCard';

// Define features outside the component to prevent recreation on each render
const features = [
  {
    title: "Student Management",
    description: "Track student attendance, grades, and performance with our comprehensive student management system."
  },
  {
    title: "Parent Communication",
    description: "Keep parents informed with real-time updates about their child's progress, attendance, and school activities."
  },
  {
    title: "Administrative Tools",
    description: "Streamline administrative tasks with powerful tools for staff management, scheduling, and resource allocation."
  },
  {
    title: "Digital Learning",
    description: "Enable seamless digital learning with integrated virtual classrooms and learning management features."
  }
];

// Memoize the button click handlers to prevent recreation on each render
function MainPage() {
  // Memoized navigation handlers
  const handleGetStarted = () => {
    window.location.href = '/auth/signup';
  };

  const handleLearnMore = () => {
    window.location.href = '/about-us';
  };

  const handleStartFreeTrial = () => {
    window.location.href = '/auth/signup';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <LandingNavbar />
      {/* Hero Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="lg:pr-12 max-w-2xl mx-auto lg:mx-0">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight tracking-tight mb-6">
              Transform Your
              <br className="hidden sm:block" />
              <span className="text-blue-600">School Management</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-8">
              Our comprehensive school management system helps educational institutions streamline operations, enhance communication, and improve learning outcomes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <button 
                onClick={handleGetStarted}
                className="px-6 py-3 text-base font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors will-change-transform shadow-lg hover:shadow-xl"
              >
                Get Started
              </button>
              <button 
                onClick={handleLearnMore}
                className="px-6 py-3 text-base font-semibold bg-white text-blue-600 rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors will-change-transform"
              >
                Learn More
              </button>
            </div>
          </div>
          <div className="w-full max-w-2xl mx-auto lg:mx-0">
            <ImageSlider />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-4">
          Powerful Features for Modern Education
        </h2>
        <p className="text-lg text-gray-600 text-center mb-12 max-w-3xl mx-auto">
          Our platform provides all the tools you need to manage your educational institution efficiently
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-blue-600 text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to Transform Your School?
          </h2>
          <p className="text-lg sm:text-xl mb-8 opacity-90">
            Join thousands of schools already using our platform to enhance their educational management
          </p>
          <button 
            onClick={handleStartFreeTrial}
            className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors will-change-transform"
          >
            Start Free Trial
          </button>
        </div>
      </section>
      <Footer />
    </div>
   
  );
}

export default memo(MainPage);