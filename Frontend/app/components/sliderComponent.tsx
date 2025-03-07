"use client"
import React, { useState, useEffect } from 'react';

const ImageSlider = () => {
  const images = [
    '/classroom.jpeg',
    '/library.avif',
    '/students.avif'
  ];

  const captions = [
    'Modern Digital Classrooms',
    'Comprehensive Learning Resources',
    'Enhanced Student Collaboration'
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((current) => (current + 1) % images.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [images.length]);

  // Handle manual navigation
  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden shadow-md">
      <div className="relative h-44 sm:h-52 md:h-60 overflow-hidden">
        {/* Current Slide */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-black bg-opacity-30 z-10" />
          <img
            src={images[currentIndex]}
            alt={captions[currentIndex]}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 z-20">
            <p className="text-sm sm:text-base font-semibold text-center">
              {captions[currentIndex]}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex space-x-2 z-30">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-white' : 'bg-white/50'
            } hover:bg-white`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Previous/Next Buttons */}
      <button
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full z-30"
        onClick={() => goToSlide((currentIndex - 1 + images.length) % images.length)}
        aria-label="Previous slide"
      >
        ←
      </button>
      <button
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full z-30"
        onClick={() => goToSlide((currentIndex + 1) % images.length)}
        aria-label="Next slide"
      >
        →
      </button>
    </div>
  );
};

export default ImageSlider;