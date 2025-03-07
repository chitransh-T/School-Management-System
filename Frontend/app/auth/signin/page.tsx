"use client";

import React, { useState } from "react";
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
  const { login } = useAuth();

  const signInWithEmail = async () => {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setAuthing(true);
    try {
      // Simulate authentication (replace this with your actual API call)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      login();
      router.push("/Admindashboard");
    } catch (err) {
      setError("Failed to sign in. Please try again.");
    } finally {
      setAuthing(false);
    }
  };

  const signInWithGoogle = async () => {
    setAuthing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      login();
      router.push("/Admindashboard");
    } catch (err) {
      setError("Failed to sign in with Google.");
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
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
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
                className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
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

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Google Sign In Button */}
            <button
              onClick={signInWithGoogle}
              disabled={authing}
              className={`w-full flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                authing ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <img
                className="h-5 w-5 mr-2"
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google logo"
              />
              <span>Sign in with Google</span>
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="text-center pt-2">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                href="/auth/signup"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;