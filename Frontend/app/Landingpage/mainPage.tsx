


"use client";

import { CheckCircle, Users, Calendar, ChartBar, FileText, Shield, Star, Database, MessageSquare } from 'lucide-react';
import { memo, useEffect, useRef } from 'react';
import { LandingNavbar } from '../components/LandingNavbar';
import HeroSection from '../landingpage-component/HeroSection';
import FeaturesSection from '../landingpage-component/FeaturesSection';
import AdvancedFeaturesSection from '../landingpage-component/AdvancedFeaturesSection';
import VisualizeSuccessSection from '../landingpage-component/VisualizeSuccessSection';
import TestimonialsSection from '../landingpage-component/TestimonialsSection';
import FutureVisionSection from '../landingpage-component/FutureVisionSection';
import CallToActionSection from '../landingpage-component/CallToActionSection';
import Footer from '../components/footer';

// Memoize the FeatureCard component
export const FeatureCard = memo(({ title, description, icon: Icon, iconClassName }: { title: string; description: string; icon: React.ElementType; iconClassName?: string }) => (
  <div className="bg-white p-6 rounded-xl shadow-md border border-blue-100 hover:shadow-lg transition-all duration-300 hover:bg-blue-50 h-48 flex flex-col justify-between">
    <div className="flex items-start space-x-4">
      <Icon className={`w-6 h-6 text-blue-600 flex-shrink-0 mt-1 ${iconClassName}`} />
      <div>
        <h3 className="text-lg font-semibold text-blue-900 mb-2">{title}</h3>
        <p className="text-blue-600 text-sm line-clamp-3">{description}</p>
      </div>
    </div>
  </div>
));

FeatureCard.displayName = 'FeatureCard';

// New Image-Based Feature Card Component
export const ImageFeatureCard = memo(({ title, description, stats, image, imageAlt }: {
  title: string;
  description: string;
  stats: string;
  image: string;
  imageAlt: string;
}) => (
  <div className="bg-white rounded-xl shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-500 transform hover:scale-105 overflow-hidden group">
    <div className="relative h-48 overflow-hidden">
      <img
        src={image}
        alt={imageAlt}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <p className="text-sm font-medium">{stats}</p>
      </div>
    </div>
    <div className="p-6">
      <h3 className="text-xl font-bold text-blue-900 mb-3 group-hover:text-blue-700 transition-colors duration-300">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  </div>
));

ImageFeatureCard.displayName = 'ImageFeatureCard';

// Enhanced features with additional Hannibal school management aspects
export const features = [
  {
    title: "Student Management",
    description: "Track attendance, grades, and progress for 10,000+ students with historical data analysis."
  },
  {
    title: "Parent Communication",
    description: "Engage parents with automated notifications and a 98% read rate."
  },
  {
    title: "Administrative Tools",
    description: "Efficiently manage staff, schedules, and resources with 99% accuracy."
  },
  {
    title: "Digital Learning",
    description: "Provide 20,000+ hours of e-learning with archived course materials."
  },
  {
    title: "Fee & Payroll Management",
    description: "Automate fee collection and staff payroll for 8,000+ users securely."
  },
  {
    title: "Compliance & Security",
    description: "Ensure data privacy with GDPR-compliant tools and regular audits."
  },
  {
    title: "Library & Resource Tracking",
    description: "Manage 5,000+ books and resources with a digital catalog system."
  }
];

// Updated image-based features
export const imageBasedFeatures = [
  {
    title: "Student Information & Academic Management",
    description: "This feature handles everything related to students' academics, including admissions, attendance, timetables, homework, exams, and report cards. It helps teachers manage academic records and allows students and parents to track performance easily.",
    stats: "Used by 12,000+ schools",
    image: "https://www.edusys.co/images/student-information-system-software.png",
    imageAlt: "Students working on academic tasks with digital tools"
  },
  {
    title: "Administrative & Communication Management",
    description: "This part manages school operations like fee collection, staff payroll, transport, and hostel services. It also enables smooth communication between teachers, parents, and students through alerts, messages, and announcements.",
    stats: "Active in 8,000+ institutions",
    image: "https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: "Administrative office managing school operations"
  }
];

// Testimonial data
export const testimonials = [
  {
    name: "John Doe",
    role: "Principal",
    text: "This system has revolutionized our school operations with its comprehensive tools."
  },
  {
    name: "Jane Smith",
    role: "Teacher",
    text: "The archived resources and security features are exceptional for our needs."
  }
];

// Custom 3D Slider with updated diverse school management images
export const ThreeDImageSlider = () => {
  const sliderRef = useRef<HTMLDivElement>(null);

  const images = [
    { src: "https://cdn.prod.website-files.com/65fabbf8f7f7323a634a308c/6697a5468ec13459ef65d5b5_acacdc.png", alt: "School event with students and banners" },
    { src: "https://www.hostinger.com/my/tutorials/wp-content/uploads/sites/45/2018/08/wordpress-slider-.webp", alt: "Teacher working at desk with laptop" },
    { src: "https://images.pexels.com/photos/3183192/pexels-photo-3183192.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1", alt: "Administrative office with computers" }
  ];

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    let currentIndex = 0;
    const rotateSlider = () => {
      currentIndex = (currentIndex + 1) % images.length;
      if (slider) {
        slider.style.transform = `perspective(1200px) rotateY(${currentIndex * -90}deg)`;
      }
    };

    const interval = setInterval(rotateSlider, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full mx-auto h-56 sm:h-72 md:h-80 overflow-hidden rounded-xl shadow-lg bg-gradient-to-br from-sky-50 via-blue-50 to-slate-100">
      <div
        ref={sliderRef}
        className="absolute w-full h-full transition-transform duration-1000 ease-in-out"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {["0deg", "90deg", "-90deg", "-180deg"].map((rotation, index) => (
          <div
            key={index}
            className="absolute w-full h-full backface-hidden flex items-center justify-center"
            style={{
              transform: `rotateY(${rotation}) translateZ(350px)`,
              backgroundColor: index === 0 ? '#e6f0fa' : index === 1 ? '#e0f7fa' : index === 2 ? '#f1f5f9' : '#e6f0fa',
              borderRadius: '0.75rem'
            }}
          >
            <img src={images[index % 3].src} alt={images[index % 3].alt} className="w-3/4 h-auto object-contain" />
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Page rendering all sections
function MainPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-blue-50 to-slate-100">
    <LandingNavbar/>
      <HeroSection />
      <FeaturesSection />
      <AdvancedFeaturesSection />
      <VisualizeSuccessSection />
      <TestimonialsSection />
      <FutureVisionSection />
      <CallToActionSection />
      <Footer />
    </div>
  );
}
export default memo(MainPage);