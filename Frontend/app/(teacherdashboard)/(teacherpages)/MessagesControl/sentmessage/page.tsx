

"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/app/dashboardComponents/DashboardLayout";

interface Student {
  id: string;
  name: string;
  assignedClass: string;
  assignedSection: string;
}

const SendMessagePage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  useEffect(() => {
    const init = async () => {
      const storedToken = localStorage.getItem("token");
      setToken(storedToken);
      if (storedToken) {
        await loadAssignedClass(storedToken);
      }
      setIsInitialLoading(false);
    };
    init();
  }, []);

  const loadAssignedClass = async (authToken: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${baseUrl}/api/assigned-class`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.status === 200) {
        const data = await response.json();
        setSelectedClass(data.class_name);
        setSelectedSection(data.section);
        await fetchStudents(authToken, data.class_name, data.section);
      } else if (response.status === 401) {
        handleUnauthorized();
      } else if (response.status === 404) {
        showError("No class assigned to this teacher");
      } else {
        showError("Failed to fetch assigned class");
      }
    } catch (error) {
      showError(`Error fetching class info: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async (authToken: string, className: string, section: string) => {
    try {
      const response = await fetch(`${baseUrl}/api/getstudents/teacher-class`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();
      const studentsArray = data.students || data.data || [];

      if (!Array.isArray(studentsArray)) {
        showError("Invalid data format received from server.");
        return;
      }

      const studentList = studentsArray.map((item: any) => ({
        id: item.student_id || item.id || "",
        name: item.student_name || "Unknown",
        assignedClass: item.assigned_class || className,
        assignedSection: item.assigned_section || section,
      }));

      setStudents(studentList);
    } catch (error) {
      showError(`Error fetching students: ${error}`);
    }
  };

  const handleUnauthorized = () => {
    localStorage.removeItem("token");
    setToken(null);
    showError("Session expired. Please login again.");
    router.push("/login");
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const handleSendMessage = (studentId: string) => {
    if (studentId) {
      const student = students.find((s) => s.id === studentId);
      const studentName = student ? encodeURIComponent(student.name) : "Unknown";
      router.push(`/MessagesControl/textsent?studentId=${encodeURIComponent(studentId)}&studentName=${studentName}`);
    } else {
      showError("Invalid student selection");
    }
  };

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-100 p-4">
        <h1 className="text-2xl font-bold mb-4 text-center text-blue-900">
          Send Messages
        </h1>

        {isInitialLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
          </div>
        ) : !token ? (
          <div className="text-center text-red-600">You are not logged in.</div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-4 flex justify-center gap-4 rounded shadow text-gray-700">
              <p><strong>Class:</strong> {selectedClass || "Not assigned"}</p>
              <p><strong>Section:</strong> {selectedSection || "Not assigned"}</p>
            </div>

            <div className="bg-white p-2 w-1/2 rounded shadow">
              <label className="block text-sm font-medium mb-1 text-blue-900">Search Student</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                placeholder="Search by name"
                className="w-full p-2 border border-gray-300 rounded text-gray-500"
              />
            </div>

            {errorMessage && (
              <div className="bg-red-600 text-white p-3 rounded">{errorMessage}</div>
            )}

            <div className="space-y-4">
              {filteredStudents.length === 0 ? (
                <p className="text-gray-700">No students found.</p>
              ) : (
                filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between bg-white p-4 rounded shadow"
                  >
                    <div>
                      <p className="font-medium text-blue-900">{student.name}</p>
                      <p className="text-sm text-gray-600">
                        {student.assignedClass} - {student.assignedSection}
                      </p>
                    </div>
                    <button
                      onClick={() => handleSendMessage(student.id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SendMessagePage;