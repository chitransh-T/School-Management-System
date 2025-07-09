
'use client';

import { useEffect, ReactNode, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteWrapperProps {
  children: ReactNode;
}

/**
 * ProtectedRouteWrapper component to handle route protection across the application
 * Allows access to auth routes when not logged in
 * Redirects to signin page for all other routes when not authenticated
 */
const ProtectedRouteWrapper = ({ children }: ProtectedRouteWrapperProps) => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Define public routes that don't require authentication
  const publicRoutes = ['/auth/signin', '/', '/auth/reset-password','/quicklinks/about-us','/quicklinks/privacy-policy','/quicklinks/terms-conditions','/faq'];

  useEffect(() => {
    // Check if we're on the client side
    if (typeof window !== 'undefined') {
      // If not authenticated and not on a public route, redirect to signin
      if (!isAuthenticated && !publicRoutes.includes(pathname)) {
        // Set redirecting state to prevent flashing content
        setIsRedirecting(true);
        
        // Use a small timeout to allow any logout redirects to complete first
        const redirectTimer = setTimeout(() => {
          // Check if we're already on the homepage (which might happen after logout)
          // This prevents redirect loops
          if (pathname !== '/') {
            console.log('Redirecting to homepage from:', pathname);
            router.push('/');
          } else {
            setIsRedirecting(false);
          }
        }, 100);
        
        return () => clearTimeout(redirectTimer);
      } else {
        setIsRedirecting(false);
      }
    }
  }, [isAuthenticated, pathname, router]);

  // If redirecting or not authenticated and not on a public route, show loading
  if (isRedirecting || (!isAuthenticated && !publicRoutes.includes(pathname))) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Otherwise, render the children
  return <>{children}</>;
};

export default ProtectedRouteWrapper;