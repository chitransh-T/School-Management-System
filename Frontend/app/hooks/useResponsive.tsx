'use client';

import { useState, useEffect } from 'react';

type BreakpointType = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface BreakpointConfig {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

// Default breakpoints matching Tailwind CSS
const defaultBreakpoints: BreakpointConfig = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/**
 * A hook that returns the current breakpoint based on window width
 * and provides utility functions for responsive behavior.
 */
export function useResponsive(customBreakpoints?: Partial<BreakpointConfig>) {
  const breakpoints = { ...defaultBreakpoints, ...customBreakpoints };
  const [breakpoint, setBreakpoint] = useState<BreakpointType>('xs');
  const [windowWidth, setWindowWidth] = useState<number>(0);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Set initial values
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);

      if (width >= breakpoints['2xl']) {
        setBreakpoint('2xl');
      } else if (width >= breakpoints.xl) {
        setBreakpoint('xl');
      } else if (width >= breakpoints.lg) {
        setBreakpoint('lg');
      } else if (width >= breakpoints.md) {
        setBreakpoint('md');
      } else if (width >= breakpoints.sm) {
        setBreakpoint('sm');
      } else {
        setBreakpoint('xs');
      }
    };

    // Set initial values
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoints]);

  // Utility functions
  const isXs = breakpoint === 'xs';
  const isSm = breakpoint === 'sm';
  const isMd = breakpoint === 'md';
  const isLg = breakpoint === 'lg';
  const isXl = breakpoint === 'xl';
  const is2Xl = breakpoint === '2xl';

  const isMobile = isXs || isSm;
  const isTablet = isMd;
  const isDesktop = isLg || isXl || is2Xl;

  const isSmUp = breakpoint !== 'xs';
  const isMdUp = ['md', 'lg', 'xl', '2xl'].includes(breakpoint);
  const isLgUp = ['lg', 'xl', '2xl'].includes(breakpoint);
  const isXlUp = ['xl', '2xl'].includes(breakpoint);

  return {
    breakpoint,
    windowWidth,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2Xl,
    isMobile,
    isTablet,
    isDesktop,
    isSmUp,
    isMdUp,
    isLgUp,
    isXlUp,
  };
} 