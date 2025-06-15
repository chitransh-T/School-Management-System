'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
import { useAuth } from '@/app/context/AuthContext';

interface ProfileData {
  institute_name: string;
  address: string;
  logo: string | null;
}

const defaultLogo = '/images/default-institute-logo.png';

export default function ProfileSetupPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData>({
    institute_name: '',
    address: '',
    logo: null,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Authentication token not found');
          setIsLoading(false);
          return;
        }

        await loadProfile(token);
      } catch (err) {
        console.error('Auth check error:', err);
        setIsLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const loadProfile = async (token: string) => {
    setIsLoading(true);
    if (!user?.email) {
      setError('User email not available');
      setIsLoading(false);
      return;
    }
    

    setError('');
    try {
      // Follow the same pattern as student details page
      const response = await fetch(`${baseUrl}/api/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          // Profile not found - first time setup
          setIsFirstTime(true);
          setProfile({
            institute_name: '',
            address: '',
            logo: null,
          });
          setIsLoading(false);
          return;
        } else if (response.status === 401) {
          throw new Error('Session expired. Please sign in again.');
        } else {
          throw new Error(`Failed to fetch profile: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log('Profile data received:', data);
      
      if (data.success) {
        const profileData = data.data;
        setProfile({
          institute_name: profileData.institute_name || '',
          address: profileData.address || '',
          logo: profileData.logo_url ? `${baseUrl}${profileData.logo_url}` : null,
        });
        setIsFirstTime(false);
      } else {
        setIsFirstTime(true);
        setProfile({
          institute_name: '',
          address: '',
          logo: null,
        });
      }
    } catch (err) {
      console.error('Profile load error:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('Session expired')) {
          setError('Session expired. Please sign in again.');
          router.push('/auth/signin');
        } else {
          setError('Error fetching profile. Please try again.');
        }
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size < 100) {
        setError('Selected image is too small');
        return;
      }

      if (!file.type.match('image.*')) {
        setError('Please select an image file');
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      if (typeof window === 'undefined') return;
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication token not found');
        setIsLoading(false);
        return;
      }

      if (!profile.institute_name.trim() || !profile.address.trim()) {
        setError('Institute name and address are required');
        setIsLoading(false);
        return;
      }

      if (isFirstTime && !logoFile) {
        setError('Logo is required for first-time setup');
        setIsLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('institute_name', profile.institute_name.trim());
      formData.append('address', profile.address.trim());
      
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      // Use the same fetch pattern as student details page
      const response = await fetch(`${baseUrl}/api/profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData, let browser set it with boundary
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Save response:', data);

      if (data.success) {
        setSuccessMessage('Profile saved successfully!');
        setIsFirstTime(false);
        
        // Update the logo URL with the one from the server
        if (data.data.logo_url) {
          setProfile(prev => ({
            ...prev,
            logo: `${baseUrl}${data.data.logo_url}`
          }));
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
        
        // Optionally redirect after a delay
        setTimeout(() => {
          router.push('/principledashboard');
        }, 1500);
      } else {
        setError(data.message || 'Failed to save profile');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 max-w-xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4 text-blue-900">
          {isFirstTime ? 'Set Up Institute Profile' : 'Update Institute Profile'}
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
              <button onClick={() => setError('')} className="text-red-700 hover:text-red-900">
                &times;
              </button>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{successMessage}</span>
              </div>
              <button onClick={() => setSuccessMessage('')} className="text-green-700 hover:text-green-900">
                &times;
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="relative w-32 h-32 mx-auto">
            <label className="cursor-pointer block">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
              <div className="relative w-32 h-32 rounded-full border-2 border-blue-300 overflow-hidden flex items-center justify-center bg-gray-100">
                {profile.logo ? (
                  <Image
                    src={profile.logo}
                    alt="Institute Logo"
                    layout="fill"
                    objectFit="cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = defaultLogo;
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-gray-400">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 right-0 bg-blue-700 rounded-full p-1">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </div>
            </label>
          </div>

          <div>
            <label className="block mb-1 text-blue-800 font-medium">Institute Name*</label>
            <input
              type="text"
              value={profile.institute_name}
              onChange={(e) => setProfile({ ...profile, institute_name: e.target.value })}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="Enter institute name"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-blue-800 font-medium">Institute Address*</label>
            <textarea
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="Enter institute address"
              rows={3}
              required
            />
          </div>

          <button
            onClick={handleSave}
            disabled={isLoading}
            className={`w-full bg-blue-900 text-white py-3 rounded-md hover:bg-blue-800 transition-colors ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              isFirstTime ? 'CREATE PROFILE' : 'UPDATE PROFILE'
            )}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}