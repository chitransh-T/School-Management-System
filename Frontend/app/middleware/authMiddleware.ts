/**
 * Authentication middleware for protecting routes
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, getUserRole } from '../utils/api';

/**
 * Middleware to check if user is authenticated
 * Redirects to login page if not authenticated
 */
export function withAuth(handler: (req: NextRequest) => NextResponse) {
  return (req: NextRequest) => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      // Redirect to login page
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
    
    // User is authenticated, proceed to handler
    return handler(req);
  };
}

/**
 * Middleware to check if user has required role
 * Redirects to unauthorized page if role doesn't match
 */
export function withRole(role: string | string[], handler: (req: NextRequest) => NextResponse) {
  return (req: NextRequest) => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      // Redirect to login page
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
    
    // Get user role
    const userRole = getUserRole();
    
    // Check if user has required role
    const roles = Array.isArray(role) ? role : [role];
    if (!userRole || !roles.includes(userRole)) {
      // Redirect to unauthorized page
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    
    // User has required role, proceed to handler
    return handler(req);
  };
}
