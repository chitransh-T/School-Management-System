


'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
import Calendar from '@/app/components/calender';

const TeacherDashboardPage = () => {
  const router = useRouter();
  const [teacherName, setTeacherName] = useState("Teacher");
  const [instituteName, setInstituteName] = useState("School");
  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
  const [assignedClass, setAssignedClass] = useState<string | null>(null);
  const [assignedSection, setAssignedSection] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState<any[]>([]);

  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    fetchTeacherProfile();
    fetchAssignedClass();
    fetchNotices();
  }, []);

  const fetchTeacherProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/api/teachers/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data?.data;
      setTeacherName(data?.teacher_name || "Teacher");
      setInstituteName(data?.institute_name || "School");
      setAssignedClasses(data?.assigned_classes || []);
      setLoading(false);
    } catch (err) {
      setErrorMessage("Error fetching teacher profile.");
      setLoading(false);
    }
  };

  const fetchAssignedClass = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/api/assigned-class`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAssignedClass(res.data?.class_name || "Not assigned");
      setAssignedSection(res.data?.section || "Not assigned");
    } catch (err: any) {
      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        router.push("/login");
      } else {
        setErrorMessage("Failed to fetch assigned class.");
      }
    }
  };

  const fetchNotices = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/api/notices`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        setNotices(res.data.data || []);
      } else {
        throw new Error("Failed to fetch notices");
      }
    } catch (error) {
      console.error("Error fetching notices:", error);
      setErrorMessage("Failed to load notices.");
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen p-6 bg-gray-50">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Welcome to {instituteName}</h1>
          <p className="text-lg text-gray-600 mt-1">Hello, {teacherName}</p>
          {assignedClass && assignedSection && (
            <p className="text-sm text-gray-600 mt-1">
              Class Teacher of {assignedClass} - {assignedSection}
            </p>
          )}
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {errorMessage}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-white rounded-xl shadow flex items-center gap-4">
            <span className="text-3xl">📚</span>
            <div>
              <p className="text-gray-600">Total Assigned Classes To Teach</p>
              <p className="text-xl font-bold text-blue-700">{assignedClasses.length}</p>
            </div>
          </div>
        </div>

        {/* Assigned Classes */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-3 text-gray-700">Teaching Assignments</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {assignedClasses.map((cls, idx) => (
              <div
                key={idx}
                className="p-4 bg-white rounded-lg shadow border border-gray-200"
              >
                <p className="text-lg font-medium text-gray-800">
                  {cls.class_name || "N/A"} - Section {cls.section || "N/A"}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Subjects: {(cls.subjects || []).join(", ") || "N/A"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Notices + Calendar Section */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Notices */}
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-3 text-gray-700">Notices</h2>
            {notices.length > 0 ? (
              <div className="space-y-3">
                {notices.map((notice, idx) => (
                  <div
                    key={notice.id || idx}
                    className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow"
                  >
                    <h3 className="font-bold text-yellow-800">{notice.title}</h3>
                    <p className="text-gray-700 mt-1">{notice.content}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Date: {new Date(notice.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No notices found.</p>
            )}
          </div>

          {/* Calendar */}
          <div className="w-full lg:w-80">
            <h2 className="text-xl font-semibold mb-3 text-gray-700">Calendar</h2>
            <div className="bg-white rounded-lg shadow-md p-4">
              <Calendar />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboardPage;