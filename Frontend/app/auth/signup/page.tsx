
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Add this import

const Signup: React.FC = () => {
  const router = useRouter();
  const [authing, setAuthing] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [error, setError] = useState<string>("");

  const signUpWithEmail = async () => {
    if (!email || !password || !confirmPassword || !phone) {
      setError("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setAuthing(true);
    setError("");

    try {
      // Simulate API call (replace with actual logic)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("Signed up successfully!");
      router.push("/auth/signin"); // Redirect to SignIn page after signup
    } catch (err) {
      setError("Failed to sign up. Please try again.");
    } finally {
      setAuthing(false);
    }
  };

  const signUpWithGoogle = async () => {
    setAuthing(true);
    try {
      // Simulate API call (replace with actual logic)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("Signed up with Google!");
      router.push("/auth/signin");
    } catch (err) {
      setError("Failed to sign up with Google.");
    } finally {
      setAuthing(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)] flex items-center justify-center bg-slate-500 px-4 py-6 mt-16">
      {/* Centered Signup Form */}
      <div className="w-full max-w-[350px] bg-[#282c34] p-5 rounded-lg shadow-lg">
        {/* Header Section */}
        <div className="text-white mb-4 text-center">
          <h3 className="text-xl font-bold mb-1">Sign Up</h3>
          <p className="text-sm">Welcome! Please enter your details below.</p>
        </div>

        {/* Input Fields */}
        <div className="mb-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full text-white py-1.5 mb-3 bg-transparent border-b border-gray-500 focus:outline-none focus:border-white text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="tel"
            placeholder="Phone Number"
            className="w-full text-white py-1.5 mb-3 bg-transparent border-b border-gray-500 focus:outline-none focus:border-white text-sm"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full text-white py-1.5 mb-3 bg-transparent border-b border-gray-500 focus:outline-none focus:border-white text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Re-Enter Password"
            className="w-full text-white py-1.5 mb-3 bg-transparent border-b border-gray-500 focus:outline-none focus:border-white text-sm"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {/* Error Message */}
        {error && <div className="text-red-500 mb-3 text-center text-sm">{error}</div>}

        {/* Signup Button */}
        <button
          onClick={signUpWithEmail}
          disabled={authing}
          className={`w-full py-1.5 bg-transparent border border-white text-white font-semibold rounded-md text-sm ${
            authing ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-white hover:text-black transition-colors"
          }`}
        >
          Sign Up
        </button>

        {/* Divider */}
        <div className="flex items-center my-3">
          <div className="flex-grow h-[1px] bg-gray-500"></div>
          <p className="mx-3 text-sm text-gray-500">OR</p>
          <div className="flex-grow h-[1px] bg-gray-500"></div>
        </div>

        {/* Google Signup Button */}
        <button
          onClick={signUpWithGoogle}
          disabled={authing}
          className={`w-full py-1.5 bg-white text-black font-semibold rounded-md text-sm ${
            authing ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-100 transition-colors"
          }`}
        >
          Sign Up With Google
        </button>

        {/* Login Link */}
        <div className="text-center mt-3">
          <p className="text-sm text-gray-400">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-white font-semibold underline hover:text-gray-300 transition-colors">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;