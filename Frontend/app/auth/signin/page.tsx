"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

const SignIn: React.FC = () => {
  const router = useRouter();
  const [authing, setAuthing] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Determine which dashboard to redirect to based on role
      let redirectPath =''; // Default
      if(user.role === 'admin') {
        redirectPath = '/admindashboard';
      }
      else if(user.role === 'principal') {
        redirectPath = '/principledashboard';
      }
      else if(user.role === 'teacher') {
        redirectPath = '/Teacherdashboard';
      }
      else if(user.role === 'student') {
        redirectPath = '/Studentdashboard';
      }
      
      router.push(redirectPath);
    }
  }, [isAuthenticated, user, router]);

  const signInWithEmail = async () => {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    setAuthing(true);
    setError("");
    
    try {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("API did not return JSON. Endpoint might be incorrect.");
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Check if we have success and token in the response
      if (!data.success || !data.token) {
        throw new Error('Invalid response from server');
      }

      // Store the token in localStorage
      localStorage.setItem('token', data.token);
      
      // Store token and role in cookies for middleware access
      document.cookie = `token=${data.token}; path=/; max-age=${60*60}`; // 1 hour expiry
      document.cookie = `userRole=${data.role}; path=/; max-age=${60*60}`; // 1 hour expiry
      
      // Create a user object with the token information
      const userData = {
        id: Date.now(), // Generate a temporary ID
        email: email,
        role: data.role,
        token: data.token
      };

      // Login successful with user data
      login(userData);
      
      // Redirect based on role
      if (data.role === 'admin') {
        router.push("/admindashboard");
      } else if (data.role === 'teacher') {
        router.push("/Teacherdashboard");
      } else if (data.role === 'student') {
        router.push("/Studentdashboard");
      } else {
        router.push("/"); // Default fallback
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : "Failed to sign in. Please try again.");
    } finally {
      setAuthing(false);
    }
  };


  return (
    <div className="w-full min-h-screen pt-20 pb-8 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="w-full max-w-md mx-4">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-gray-100">
          {/* Logo and Header */}
          <div className="text-center space-y-2">
            <img
              src="https://almanet.in/wp-content/uploads/2022/03/Almanet-logo-220x47-1.png"
              alt="Logo"
              className="h-8 mx-auto"
            />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-sm text-gray-600 max-w-sm mx-auto">
              Sign in to access your school management dashboard
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Form Section */}
          <div className="space-y-5">
            {/* Email Input */}
             <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                placeholder="Email address"
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm   text-gray-700 transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 text-gray-700   rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    signInWithEmail();
                  }
                }}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>

            {/* Forgot Password Link */}
            <div className="flex items-center justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Forgot your password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              onClick={signInWithEmail}
              disabled={authing}
              className={`w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                authing ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {authing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>

            
            
          </div>

         
        </div>
      </div>
    </div>
  );
};

export default SignIn;