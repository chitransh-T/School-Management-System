'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

interface RouteGuardProps {
  children: ReactNode;
}

/**
 * RouteGuard component to protect routes that require authentication
 * Redirects to signin page if user is not authenticated
 */
const RouteGuard = ({ children }: RouteGuardProps) => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check if we're on the client side
    if (typeof window !== 'undefined') {
      // If not authenticated, redirect to signin page
      if (!isAuthenticated) {
        router.push('/auth/signin');
      }
    }
  }, [isAuthenticated, router]);

  // If not authenticated, don't render children while redirecting
  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If authenticated, render the protected content
  return <>{children}</>;
};

export default RouteGuard;
