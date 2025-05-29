"use client";
import { useState } from 'react';
import Sidebar from '@/app/dashboardComponents/sidebar';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
export default function StudentLeaveCertificatePage() {
    const studentName = "User";
    
    const handlePrintCertificate = () => {
        // Add print certificate logic here
        console.log('Printing certificate for:', studentName);
    };

    return (
            <DashboardLayout>
            <div className="flex-1 bg-gray-50">
                <div className="w-full h-full flex my-12 justify-center">
                    {/* Remove max-w-xl and px-4 to allow full width */}
                    <div className="w-full m-4 my-8">
                        <div className="w-full p-8 bg-pink-100 rounded-lg shadow-sm">
                            <div className="flex flex-col items-center justify-center">
                                {/* Avatar Image */}
                                <div className="mb-2 w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
                                    <div className="w-20 h-20 relative">
                                        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                            {/* Head */}
                                            <circle cx="50" cy="40" r="25" fill="#001F3F" />
                                            {/* Body */}
                                            <path d="M30 70 Q50 85 70 70 V100 H30 Z" fill="#4761C5" />
                                            {/* Face (blank area) */}
                                            <path d="M35 40 Q50 45 65 40 Q65 55 50 60 Q35 55 35 40 Z" fill="#FDCFCF" />
                                        </svg>
                                    </div>
                                </div>
                                
                                {/* Student Name */}
                                <h2 className="text-xl font-medium text-indigo-600 mb-6">{studentName}</h2>
                                
                                {/* Print Certificate Button */}
                                <button
                                    onClick={handlePrintCertificate}
                                    className="flex items-center justify-center px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-colors"
                                >
                                    <svg 
                                        className="w-5 h-5 mr-2" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24" 
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth={2} 
                                            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" 
                                        />
                                    </svg>
                                    Print Leave Certificate
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}