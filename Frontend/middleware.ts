import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  // Check if the path is for authentication pages
  const isAuthPage = path === '/auth/signin' || path === '/auth/signup';
  
  // Check for authentication in multiple places
  const tokenCookie = request.cookies.get('token')?.value;
  const isAuthCookie = request.cookies.get('isAuthenticated')?.value;
  const authHeader = request.headers.get('Authorization')?.split(' ')[1];
  
  // Determine if user is authenticated
  const isAuthenticated = !!(tokenCookie || (isAuthCookie === 'true' && authHeader));
  
  // If the user is trying to access auth pages while already logged in, redirect to dashboard
  if (isAuthPage && isAuthenticated) {
    console.log('Authenticated user attempting to access auth page, redirecting...');
    
    // Get user role from cookies if available
    const userRole = request.cookies.get('userRole')?.value;
    
    // Determine which dashboard to redirect to based on role
    let redirectPath = '/Admindashboard'; // Default
    
    if (userRole === 'teacher') {
      redirectPath = '/Teacherdashboard';
    } else if (userRole === 'student') {
      redirectPath = '/Studentdashboard';
    }
    
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }
  
  // Continue with the request if not redirected
  return NextResponse.next();
}

// Configure the middleware to run only on specific paths
export const config = {
  matcher: ['/auth/signin', '/auth/signup'],
};
