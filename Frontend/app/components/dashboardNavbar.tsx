
'use client';
import React, { useEffect, useState } from 'react';
import { Bell, Home, Settings, User, LogOut, ChevronDown, Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';

interface ProfileOption {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}

interface ProfileData {
  institute_name: string;
  address: string;
  logo_url: string | null;
}

const DashboardNavbar: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { logout } = useAuth();
  const router = useRouter();
  const { user } = useAuth();

  const defaultLogo = '/images/default-institute-logo.png';

  // Fetch profile data including logo from backend
  useEffect(() => {
    const fetchProfileData = async () => {
      if (typeof window === 'undefined') return;
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${baseUrl}/api/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch profile: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
          setProfile(data.data);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load institute logo');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchProfileData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleProfile = () => {
    router.push('/profilepage');
  };

  const profileOptions: ProfileOption[] = [
    { label: 'Profile', onClick: handleProfile, icon: User },
    { label: 'Settings', href: '/settings', icon: Settings },
    { label: 'Logout', icon: LogOut, onClick: handleLogout },
  ];

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/principledashboard" className="flex-shrink-0">
            <img
              src="/logo.jpg"
              alt="Logo"
              className="h-6 sm:h-7 md:h-8 w-auto"
            />
          </Link>

          {/* Right side with profile dropdown */}
          <div className="flex items-center space-x-4">
            {/* Notification icon can be added here if needed */}
            
            {/* Profile Dropdown */}
            <div className="hidden md:block relative">
              <button
                onClick={toggleDropdown}
                className="flex items-center space-x-1 lg:space-x-2 text-gray-700 hover:text-blue-600 focus:outline-none"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                {/* Institute logo */}
                <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200">
                  {profile?.logo_url ? (
                    <Image
                      src={`${baseUrl}${profile.logo_url}`}
                      alt="Institute Logo"
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = defaultLogo;
                      }}
                    />
                  ) : (
                    <User className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <ChevronDown className="w-4 h-4" />
              </button>

              {isDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-100"
                  role="menu"
                  aria-orientation="vertical"
                >
                  {profileOptions.map((option) => (
                    <div
                      key={option.label}
                      onClick={() => {
                        option.onClick?.();
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                      role="menuitem"
                    >
                      <option.icon className="w-4 h-4 mr-3" />
                      <span>{option.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-1.5 sm:p-2 text-gray-700 hover:text-blue-600 focus:outline-none"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu Content */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="pt-2 pb-3 space-y-1">
              {profileOptions.map((option) => (
                <div
                  key={option.label}
                  onClick={() => {
                    option.onClick?.();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center px-4 py-3 text-base text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  <option.icon className="w-5 h-5 mr-3" />
                  <span>{option.label}</span>
                </div>
              ))}
            </div>
            
            {/* Show institute info in mobile menu */}
            {profile && (
              <div className="px-4 py-3 border-t border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {profile.logo_url ? (
                      <Image
                        src={`${baseUrl}${profile.logo_url}`}
                        alt="Institute Logo"
                        width={40}
                        height={40}
                        className="rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = defaultLogo;
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{profile.institute_name}</p>
                    <p className="text-xs text-gray-500 truncate">{profile.address}</p>
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

export default DashboardNavbar;