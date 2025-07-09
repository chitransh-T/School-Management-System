
'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Settings, User, LogOut, ChevronDown, Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Image from 'next/image';
import Link from 'next/link';

interface ProfileData {
  institute_name: string;
  address: string;
  logo_url: string | null;
  student_photo_url: string | null;
}

const ParentNavbar: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:1000';
  const { user, logout } = useAuth();
  const router = useRouter();

  const defaultLogo = '/images/default-student-photo.png';

  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found in localStorage');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Fetching profile with token:', token);
      const res = await fetch(`${baseUrl}/api/dashboard/students`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`API request failed with status ${res.status}`);
      }

      const data = await res.json();
      console.log('API Response:', data);

      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const student = data.data[0];
        setProfile({
          institute_name: student.institute_name || 'Demo Institute',
          address: student.address || 'Some Address',
          logo_url: null,
          student_photo_url: student.student_photo ? `${baseUrl}/uploads/${student.student_photo}` : null,
        });
        console.log('Profile set with student photo URL:', student.student_photo);
      } else {
        console.warn('No student data found in API response:', data);
        setProfile({
          institute_name: 'Demo Institute',
          address: 'Some Address',
          logo_url: null,
          student_photo_url: null,
        });
      }
    } catch (err) {
      console.error('Error in fetchProfile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      console.warn('No user found in AuthContext');
      setIsLoading(false);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const profileOptions = [
    { label: 'Logout', onClick: handleLogout, icon: LogOut },
  ];

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Admin Logo */}
          <Link href="/parentdashboard" className="flex-shrink-0">
            <img
              src="/logo.jpg"
              alt="Logo"
              className="h-6 sm:h-7 md:h-8 w-auto"
            />
          </Link>

          {/* Profile Menu */}
          <div className="flex items-center space-x-4">
            {/* Profile Dropdown */}
            <div className="hidden md:block relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-300 bg-gray-50">
                  {profile?.student_photo_url ? (
                    <Image
                      src={profile.student_photo_url}
                      alt="Student"
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = defaultLogo;
                      }}
                    />
                  ) : (
                    <User className="text-gray-400 w-full h-full p-1" />
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md py-1 z-10 border border-gray-100">
                  {profileOptions.map((opt) => (
                    <div
                      key={opt.label}
                      onClick={() => {
                        opt.onClick();
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      <opt.icon className="w-4 h-4 mr-3" />
                      {opt.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden text-gray-600 focus:outline-none"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="py-2 space-y-1">
              {profileOptions.map((opt) => (
                <div
                  key={opt.label}
                  onClick={() => {
                    opt.onClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center px-4 py-2 text-base text-gray-700 hover:bg-gray-100"
                >
                  <opt.icon className="w-5 h-5 mr-3" />
                  {opt.label}
                </div>
              ))}
            </div>

            {profile && (
              <div className="px-4 py-3 border-t border-gray-100">
                <div className="flex items-center space-x-3">
                  <div>
                    {profile.student_photo_url ? (
                      <Image
                        src={profile.student_photo_url}
                        alt="Student"
                        width={40}
                        height={40}
                        className="rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = defaultLogo;
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 flex items-center justify-center rounded-full">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{profile.institute_name}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default ParentNavbar;