

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Add this import
import { useAuth } from "@/app/context/AuthContext";

const SignIn: React.FC = () => {
  const router = useRouter();
  const [authing, setAuthing] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const signInWithEmail = async () => {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setAuthing(true);
    try {
      // Simulate authentication (replace this with your actual API call)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("Signed in successfully!");
      login();
      router.push("/Admindashboard"); // Navigate to the dashboard page after login
    } catch (err) {
      setError("Failed to sign in. Please try again.");
    } finally {
      setAuthing(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)] flex items-center justify-center bg-slate-500 px-4 py-6 mt-16">
      {/* Centered Login Form */}
      <div className="w-full max-w-[350px] bg-[#282c34] p-5 rounded-lg shadow-lg">
        {/* Header Section */}
        <div className="text-white mb-4 text-center">
          <h3 className="text-xl font-bold mb-1">Login</h3>
          <p className="text-sm">Welcome Back! Please enter your details.</p>
        </div>

        {/* Input Fields */}
        <div className="mb-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full text-white py-1.5 mb-3 bg-transparent border-b border-gray-500 focus:outline-none focus:border-white text-sm"
            value={email}
            onChange={handleEmailChange}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full text-white py-1.5 mb-3 bg-transparent border-b border-gray-500 focus:outline-none focus:border-white text-sm"
            value={password}
            onChange={handlePasswordChange}
          />
        </div>

        {/* Error Message */}
        {error && <div className="text-red-500 mb-3 text-center text-sm">{error}</div>}

        {/* Login Button */}
        <button
          onClick={signInWithEmail}
          disabled={authing}
          className={`w-full py-1.5 bg-transparent border border-white text-white font-semibold rounded-md text-sm ${
            authing ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-white hover:text-black transition-colors"
          }`}
        >
          Log In
        </button>

        {/* Divider */}
        <div className="flex items-center my-3">
          <div className="flex-grow h-[1px] bg-gray-500"></div>
          <p className="mx-3 text-sm text-gray-500">OR</p>
          <div className="flex-grow h-[1px] bg-gray-500"></div>
        </div>

        {/* Google Login Button */}
        <button
          disabled={authing}
          className={`w-full py-1.5 bg-white text-black font-semibold rounded-md text-sm ${
            authing ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-100 transition-colors"
          }`}
        >
          Log In With Google
        </button>

        {/* Sign-Up Link */}
        <div className="text-center mt-3">
          <p className="text-sm text-gray-400">
            Don't have an account?{" "}
            <Link href="/auth/signup" className="text-white font-semibold underline hover:text-gray-300 transition-colors">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;