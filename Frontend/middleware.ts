import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  // Check if the path is for authentication pages or root
  const isAuthPage = path === '/auth/signin' || path === '/auth/signup';
  const isRootPath = path === '/';
  
  // Check for authentication in multiple places
  const tokenCookie = request.cookies.get('token')?.value;
  const isAuthCookie = request.cookies.get('isAuthenticated')?.value;
  const authHeader = request.headers.get('Authorization')?.split(' ')[1];
  
  // Determine if user is authenticated
  const isAuthenticated = !!(tokenCookie || (isAuthCookie === 'true' && authHeader));
  
  // If an authenticated user is trying to access the root path or auth pages, redirect to their dashboard
  if ((isAuthPage || isRootPath) && isAuthenticated) {
    console.log('Authenticated user attempting to access auth page, redirecting...');
    
    // Get user role from cookies if available
    const userRole = request.cookies.get('userRole')?.value;
    
    // Determine which dashboard to redirect to based on role
    let redirectPath = '/principledashboard'; // Default to principal dashboard

    if (userRole === 'admin') {
      redirectPath = '/admindashboard';
    } else if (userRole === 'teacher') {
      redirectPath = '/teacherdashboard';
    } else if (userRole === 'student') {
      redirectPath = '/studentdashboard';
    }
    
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }
  
  // Continue with the request if not redirected
  return NextResponse.next();
}

// Configure the middleware to run only on specific paths
export const config = {
  matcher: ['/', '/auth/signin', '/auth/signup'],
};
