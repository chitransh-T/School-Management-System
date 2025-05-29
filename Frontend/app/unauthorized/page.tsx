"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';

const UnauthorizedPage: React.FC = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="flex justify-center mb-6">
          <AlertTriangle size={64} className="text-yellow-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
        
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        
        <div className="flex flex-col space-y-3">
          <button
            onClick={() => router.back()}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Go Back
          </button>
          
          <Link
            href="/"
            className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors inline-block"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
