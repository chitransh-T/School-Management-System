

'use client';

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import axios from "axios";
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';

const TeacherDashboardPage = () => {
  const router = useRouter();
  const [teacherName, setTeacherName] = useState("Teacher");
  const [profileImage, setProfileImage] = useState<string | null>(null);
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

      const photoPath = data?.teacher_photo_url || data?.teacher_photo;
      if (photoPath) {
        setProfileImage(
          photoPath.startsWith("http")
            ? photoPath
            : `${BASE_URL}${photoPath.startsWith("/") ? "" : "/"}${photoPath}`
        );
      }

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

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("token");
      router.push("/login");
    }
  };

  const buildCard = (title: string, value: string, icon: string) => (
    <div className="p-4 bg-blue-100 rounded-xl flex items-center gap-4">
      <span className="text-blue-700 text-2xl">{icon}</span>
      <div>
        <p className="font-semibold text-blue-700">{title}</p>
        <p className="text-xl font-bold text-blue-900">{value}</p>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-800">Welcome, {teacherName}</h1>
         
        </div>

        <div className="mb-4">
          <p className="p-4 bg-white rounded shadow text-gray-900">
            {assignedClass && assignedSection
              ? `You are the class teacher of ${assignedClass} - ${assignedSection}`
              : "No class assigned"}
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-500 text-white p-3 rounded mb-4">
            {errorMessage}
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">Assigned Classes for Teaching</h2>
          <div className="space-y-3">
            {assignedClasses.map((cls, idx) => (
              <div key={idx} className="p-4 bg-white rounded shadow text-gray-700">
                <p>{cls.class_name || "N/A"} - Section {cls.section || "N/A"}</p>
                <p className="text-sm text-gray-600">
                  Subjects: {(cls.subjects || []).join(", ") || "N/A"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {buildCard("Total Classes", assignedClasses.length.toString(), "🏫")}

        {/* Notices Section */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">Notices</h2>
          {notices.length > 0 ? (
            <ul className="space-y-2">
              {notices.map((notice, idx) => (
                <li key={notice.id || idx} className="p-4 bg-yellow-50 rounded shadow">
                  <h3 className="font-semibold text-yellow-800 ">{notice.title}</h3>
                  <p className="text-md text-yellow-700 ">{notice.description}</p>
                  <p className="text-md text-yellow-600 mt-1 ">
                    Date: {new Date(notice.created_at).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No notices found.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboardPage;
