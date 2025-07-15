'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
import { jwtDecode } from 'jwt-decode';

interface FormData {
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface DecodedToken {
  email: string;
  id: string;
  role: string;
  school_id: string;
}

const ChangePassword: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token not found. Please login again.');
      router.push('/auth/signin');
      return;
    }
    try {
      const decoded: DecodedToken = jwtDecode(token);
      console.log('Decoded Token in ChangePassword:', decoded); // Debug
      if (decoded.role !== 'principal') {
        setError('Access denied. Only principals can change passwords here.');
        router.push('/dashboard');
        return;
      }
      setFormData((prev) => ({ ...prev, email: decoded.email }));
    } catch (err) {
      console.error('Error decoding token:', err);
      setError('Failed to load user information. Please login again.');
      router.push('/auth/signin');
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!token) {
        setError('Authentication token not found. Please login again.');
        router.push('/auth/signin');
        return;
      }

      console.log('Sending change password request with:', {
        email: formData.email,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      }); // Debug

      const response = await fetch(`${baseUrl}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();
      console.log('Change password response:', data); // Debug
      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expired. Please login again.');
          router.push('/auth/signin');
          return;
        }
        throw new Error(data.message || 'Failed to update password');
      }

      setSuccess('Password updated successfully');
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (err: any) {
      console.error('Change password error:', err);
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="h-screen flex items-start justify-center bg-gray-100 pt-8 overflow-hidden">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
          <h2 className="text-xl font-bold mb-5 text-center text-gray-800">Change Password</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                readOnly
                className="mt-1 w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-sm cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="currentPassword" className="block text-xs font-medium text-gray-700">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                required
                className="mt-1 w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-xs font-medium text-gray-700">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                required
                className="mt-1 w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700">
                Re-enter New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="mt-1 w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-xs">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded text-xs">
                {success}
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-1.5 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm ${
                isLoading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Updating...' : 'Update'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChangePassword;