"use client"
import { useState } from 'react';
import Sidebar from '@/app/dashboardComponents/sidebar';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
export default function SchoolLeavePage() {
    const [date, setDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const router= useRouter();
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission logic here
    
        router.push('/printcertificate');
      };
    return (
            <DashboardLayout>
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <main className="w-full max-w-md px-4">
                    <div className="w-full p-6 bg-white rounded-lg shadow-md">
                        <div className="mb-8">
                            <label
                                htmlFor="date"
                                className="block text-sm font-medium text-gray-700 mb-1 text-left"
                            >
                                School Leave Date:
                            </label>
                            <input
                                type="date"
                                id="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-500"
                                placeholder="mm/dd/yyyy"
                            />
                        </div>

                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search Student"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                <button className="p-1" aria-label="Search">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 text-gray-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                    </svg>
                                    
                                </button>
                                
                            </div>
                        </div>
                        
                        <div className="mt-8" >
                            <button
                            type="submit"
                            onClick= {handleSubmit}
                            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                        >
                            Submit
                        </button>
                        </div>
                    </div>
                </main>
            </div>
        </DashboardLayout>
    );
}