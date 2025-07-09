

'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';

interface Teacher {
  id: string;
  name: string;
  email: string;
  dateOfBirth: string;
  dateOfJoining: string;
  gender: string;
  qualification: string;
  experience: string;
  salary: string;
  address: string;
  phone: string;
  teacherPhoto: string;
  qualificationCertificate: string;
  username: string;
  password: string;
}

const TeacherAdmissionLetterPage: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchTeachers(token);
    }
  }, []);

  const fetchTeachers = async (token: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${baseUrl}/api/teachers`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();

      const mappedTeachers: Teacher[] = data.map((t: any) => ({
        id: t.id?.toString() ?? '',
        name: t.teacher_name ?? 'Unknown Teacher',
        dateOfBirth: t.date_of_birth ?? 'N/A',
        dateOfJoining: t.date_of_joining ?? 'N/A',
        gender: t.gender ?? 'N/A',
        qualification: t.qualification ?? 'N/A',
        experience: t.experience ?? 'N/A',
        salary: t.salary ?? 'N/A',
        address: t.address ?? 'N/A',
        phone: t.phone ?? 'N/A',
        teacherPhoto: t.teacher_photo ?? '',
        qualificationCertificate: t.qualification_certificate ?? '',
        username: t.username ?? 'N/A',
        password: t.password ?? 'N/A',
      }));

      setTeachers(mappedTeachers);
      setFilteredTeachers(mappedTeachers);
    } catch (err) {
      console.error('Error loading teachers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (!value.trim()) {
      setFilteredTeachers(teachers);
    } else {
      const lower = value.toLowerCase();
      setFilteredTeachers(
        teachers.filter(
          (t) =>
            t.name.toLowerCase().includes(lower) ||
            t.email.toLowerCase().includes(lower) ||
            t.qualification.toLowerCase().includes(lower)
        )
      );
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setFilteredTeachers(teachers);
  };

  const handleViewLetter = (teacher: Teacher) => {
    // Store teacher data in localStorage
    localStorage.setItem('selectedTeacher', JSON.stringify(teacher));
    // Navigate to the job letter print page
    router.push('/jobletter/printletter');
  };

  const renderTeacherImage = (photoPath: string) => {
    if (!photoPath) {
      return (
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-700" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2c-3.3 0-10 1.7-10 5v2h20v-2c0-3.3-6.7-5-10-5z" />
          </svg>
        </div>
      );
    }

    return (
      <Image
        src={photoPath.startsWith('http') ? photoPath : `${baseUrl}/Uploads/${photoPath}`}
        alt="teacher"
        className="w-12 h-12 rounded-full object-cover"
        width={48}
        height={48}
      />
    );
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <h2 className="text-xl font-bold text-blue-800 mb-4">Teacher Job Letters</h2>

        {/* Search Box */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6 shadow">
          <label className="block text-blue-800 font-semibold mb-2">Search Teachers</label>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name, email, or qualification"
              className="w-full p-2 rounded-md border border-blue-300 focus:outline-none focus:ring focus:ring-blue-200"
            />
            {searchQuery && (
              <button onClick={handleClearSearch} className="text-blue-700 underline text-sm">
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Teacher List */}
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="loader border-t-blue-500 border-4 w-10 h-10 rounded-full animate-spin"></div>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="text-center text-blue-700">
            <p className="text-lg">No teachers {searchQuery ? 'match your search' : 'found'}.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTeachers.map((teacher) => (
              <div
                key={teacher.id}
                className="flex items-center justify-between p-4 bg-white shadow rounded-lg hover:bg-blue-50 transition cursor-pointer"
                onClick={() => handleViewLetter(teacher)}
              >
                <div className="flex items-center gap-4">
                  {renderTeacherImage(teacher.teacherPhoto)}
                  <div>
                    <p className="font-semibold text-blue-900">{teacher.name}</p>
                    <p className="text-sm text-blue-700">Email: {teacher.username}</p>
                    <p className="text-sm text-blue-700">Qualification: {teacher.qualification}</p>
                    <p className="text-sm text-blue-700">Joined: {new Date(teacher.dateOfJoining).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <svg
                    className="w-5 h-5 text-blue-800"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeacherAdmissionLetterPage;
