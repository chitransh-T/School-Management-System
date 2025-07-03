

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Phone, Lock, Eye, EyeOff, UserRound } from 'lucide-react';
import { useAuth } from "@/app/context/AuthContext";
import DashboardLayout from "@/app/dashboardComponents/DashboardLayout";
const Signup: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [authing, setAuthing] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmpassword, setConfirmPassword] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [role, setRole] = useState<string>(""); // New state for role
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [school_id , setSchool_id] = useState<string>("");
  // Redirect if already authenticated
//   useEffect(() => {
//     if (isAuthenticated && user) {
//       // Determine which dashboard to redirect to based on role
//       let redirectPath = '/admindashboard'; // Default
      
//       router.push(redirectPath);
//     }
//   }, [isAuthenticated, user, router]);

  const signUpWithEmail = async () => {
    // Clear any existing authentication cookies when attempting to sign up
    document.cookie = 'token=; path=/; max-age=0';
    document.cookie = 'userRole=; path=/; max-age=0';
    if (!school_id || !email || !password || !confirmpassword || !phone || !role) { // Added role validation
      setError("All fields are required.");
      return;
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (password !== confirmpassword) {
      setError("Passwords do not match.");
      return;
    }
  
    setAuthing(true);
    setError("");
  
    try {
      // Connect to the backend API register endpoint
      const apiUrl = `${baseUrl}/api/auth/register`;
      // const apiUrl = 'https://school-management-system-4ddi.onrender.com/api/auth/register';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          school_id,
          email,
          phone,
          password,
          confirmpassword: confirmpassword,
          role // Include role in the request body
        }),
      });
  
      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("API did not return JSON. Endpoint might be incorrect.");
      }
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
  
      // Success
      alert("Signed up successfully!");
      router.push("/auth/signin");
    } catch (err) {
      console.error("Registration error:", err);
      // Display specific error message from API if available
      setError(err instanceof Error ? err.message : "Failed to sign up. Please try again.");
    } finally {
      setAuthing(false);
    }
  };

  return (
   <DashboardLayout>
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
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Create Account</h2>
            <p className="text-sm text-gray-600 max-w-sm mx-auto">
              Join us to manage your school efficiently
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
             <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="school_id"
                placeholder="Enter school id"
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
                value={school_id}
                onChange={(e) => setSchool_id(e.target.value)}
              />
            </div>
            {/* Email Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                placeholder="Email address"
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>


            {/* Phone Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="tel"
                placeholder="Phone number"
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 text-gray-700 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
                className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 text-gray-700 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            {/* Confirm Password Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm password"
                className="block w-full pl-10 pr-10 py-2.5 border text-gray-700 border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
                value={confirmpassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>

            {/* Role Dropdown */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserRound className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 text-gray-700 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors appearance-none"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="" disabled>Select your role</option>
                <option value="principal">Principal</option>
                <option value="admin">Admin</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>

            {/* Sign Up Button */}
            <button
              onClick={signUpWithEmail}
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
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>

           

            {/* Google Sign Up Button */}
           
          </div>

          {/* Sign In Link */}
          {/* <div className="text-center pt-2">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/auth/signin"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div> */}
        </div>
      </div>
    </div>
   </DashboardLayout>
  );
};

export default Signup;