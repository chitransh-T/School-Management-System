

"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/app/dashboardComponents/DashboardLayout";

interface Student {
  id: string;
  name: string;
  assignedClass: string;
  assignedSection: string;
  isPresent: boolean;
}

const TakeAttendancePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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
        setSelectedClassId(data.class_id);
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
      console.log("Full Response:", data);
      
      const studentsArray = data.students || data.data || [];
      
      if (!Array.isArray(studentsArray)) {
        console.error("Expected array but got:", data);
        showError("Invalid data format received from server.");
        return;
      }
      
      const studentList = studentsArray.map((item: any) => ({
        id: item.student_id || item.id || "",
        name: item.student_name || "Unknown",
        assignedClass: item.assigned_class || className,
        assignedSection: item.assigned_section || section,
        isPresent: false,
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

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleStudentToggle = (index: number) => {
    setStudents((prev) =>
      prev.map((student, i) =>
        i === index ? { ...student, isPresent: !student.isPresent } : student
      )
    );
  };

  const saveAttendance = async () => {
    if (!token || !selectedClass || !selectedSection || !selectedClassId) {
      showError("Incomplete data. Please reload the page.");
      return;
    }

    setIsLoading(true);

    const attendanceData = students.map((student) => ({
      student_id: student.id,
      is_present: student.isPresent,
      class_id: selectedClassId,
      section: selectedSection,
    }));

    try {
      const response = await fetch(`${baseUrl}/api/attendance`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: selectedDate.toISOString().split("T")[0],
          students: attendanceData,
        }),
      });

      if (response.status === 200) {
        showSuccess("Attendance saved successfully");
        setTimeout(() => {
          router.push("/teacherdashboard");
        }, 2000);
      } else if (response.status === 401) {
        handleUnauthorized();
      } else {
        showError("Failed to save attendance");
      }
    } catch (error) {
      showError(`Error saving attendance: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-100 p-4">
        <h1 className="text-2xl font-bold mb-4 text-center text-blue-900">
          Take Attendance
        </h1>

        {isInitialLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
          </div>
        ) : !token ? (
          <div className="text-center text-red-600">You are not logged in.</div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-4 flex justify-between rounded shadow text-gray-700">
              <p><strong>Class:</strong> {selectedClass || "Not assigned"}</p>
              <p><strong>Section:</strong> {selectedSection || "Not assigned"}</p>
              <p><strong>Date:</strong> {selectedDate.toLocaleDateString()}</p>
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
            {successMessage && (
              <div className="bg-green-600 text-white p-3 rounded">{successMessage}</div>
            )}

            <div className="space-y-4">
              {filteredStudents.length === 0 ? (
                <p className="text-gray-700">No students found.</p>
              ) : (
                filteredStudents.map((student, index) => (
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
                    <label className="flex items-center gap-2">
                      <span className="text-sm">Present</span>
                      <input
                        type="checkbox"
                        checked={student.isPresent}
                        onChange={() => handleStudentToggle(index)}
                        className="w-5 h-5"
                      />
                    </label>
                  </div>
                ))
              )}
            </div>

            <div className="text-center">
              <button
                onClick={saveAttendance}
                disabled={isLoading || students.length === 0}
                className={`mt-6 px-6 py-2 rounded text-white ${
                  isLoading || students.length === 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isLoading ? "Saving..." : "Save Attendance"}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TakeAttendancePage;