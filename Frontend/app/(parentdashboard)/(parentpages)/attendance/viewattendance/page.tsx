

'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
import axios from 'axios';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

interface AttendanceRecord {
  attendance_id: number;
  student_name: string;
  class_name: string;
  section: string;
  date: string;
  is_present: boolean;
}

const AttendanceReport: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    if (selectedMonth) {
      fetchMonthData(selectedMonth);
    }
  }, [selectedMonth, token, router]);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    if (selectedDate) {
      fetchDateData(selectedDate);
    }
  }, [selectedDate, token, router]);

  const fetchMonthData = async (month: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/parent/attendance/month/${month}`, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setRecords(data.attendance || []);
        setErrorMessage(null);
      } else {
        setErrorMessage(data.message || 'Failed to fetch monthly attendance');
        setRecords([]);
      }
    } catch (err: any) {
      console.error('Error fetching monthly attendance:', err);
      setErrorMessage(err.message || 'Error fetching monthly attendance');
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDateData = async (date: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/parent/attendance/date/${date}`, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setRecords(data.attendance || []);
        setErrorMessage(null);
      } else {
        setErrorMessage(data.message || 'Failed to fetch daily attendance');
        setRecords([]);
      }
    } catch (err: any) {
      console.error('Error fetching daily attendance:', err);
      setErrorMessage(err.message || 'Error fetching daily attendance');
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="bg-gray-100 min-h-screen text-gray-700 px-4 py-8">
        <h1 className="text-2xl mb-2 font-bold">Get your attendance record</h1>
        <p className="mb-4 text-sm text-gray-500">You can fetch attendance month-wise and date-wise.</p>

        {errorMessage && (
          <div className="bg-red-500 text-white px-4 py-2 rounded mb-4">{errorMessage}</div>
        )}

        <div className="flex gap-6 mb-6">
          {/* Month Selector */}
          <select
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setSelectedDate('');
              setErrorMessage(null);
            }}
          >
            <option value="">Select month</option>
            {Array.from({ length: 12 }, (_, i) => {
              const month = dayjs().month(i).format('YYYY-MM-01');
              return (
                <option key={i} value={month}>
                  {dayjs().month(i).format('MMMM')}
                </option>
              );
            })}
          </select>

          {/* Date Picker */}
          <input
            type="date"
            className="px-4 py-2 rounded-lg bg-gray-200 text-black"
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedMonth('');
              setErrorMessage(null);
            }}
            value={selectedDate}
          />
        </div>

        {/* Attendance Records */}
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-gray-400">Loading attendance records...</p>
          ) : records.length === 0 ? (
            <p className="text-gray-400">No attendance records found.</p>
          ) : (
            records.map((record, index) => (
              <div key={index} className="bg-white text-black rounded-md p-4 shadow-md">
                <div className="grid grid-cols-5 font-semibold border-b pb-1 text-sm text-gray-600">
                  {/* <span>NAME</span>
                  <span>CLASS</span>
                  <span>SECTION</span> */}
                  <span>DATE</span>
                  <span>STATUS</span>
                </div>
                <div className="grid grid-cols-5 mt-2 text-sm">
                  {/* <span>{record.student_name}</span>
                  <span>{record.class_name}</span>
                  <span>{record.section}</span> */}
                  <span>{dayjs(record.date).format('DD/MM/YYYY')}</span>
                  <span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        record.is_present ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {record.is_present ? 'Present' : 'Absent'}
                    </span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AttendanceReport;