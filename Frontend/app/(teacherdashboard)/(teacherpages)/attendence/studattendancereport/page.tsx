

"use client";

import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/app/dashboardComponents/DashboardLayout";
import { format } from "date-fns";

interface AttendanceRecord {
  id?: string;
  student_id?: string;
  student_name: string;
  registration_number?: string;
  is_present: boolean;
  class_name: string;
  section: string;
  date?: string;
}

interface AssignedClass {
  class_id: number;
  class_name: string;
  section: string;
}

const StudentReportPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [className, setClassName] = useState<string | null>(null);
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
        const data: AssignedClass = await response.json();
        setSelectedClassId(data.class_id);
        setClassName(data.class_name);
        setSelectedSection(data.section);
        await fetchAttendance(authToken, data.class_id, data.section, selectedDate);
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

  const fetchAttendance = async (authToken: string, classId: number, section: string, date: Date) => {
    try {
      setIsLoading(true);
      const formattedDate = format(date, "yyyy-MM-dd");
      const url = `${baseUrl}/api/attendance/${classId}/${encodeURIComponent(section)}/${formattedDate}`;
      console.log("Fetching attendance with URL:", url);

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      console.log("Attendance response status:", response.status);

      if (response.status === 200) {
        const data = await response.json();
        console.log("Attendance response data:", data);

        if (data.message && data.students.length === 0) {
          showError(data.message);
          setAttendanceRecords([]);
          return;
        }

        const studentsArray = data.students || [];
        if (!Array.isArray(studentsArray)) {
          console.error("Expected array but got:", data);
          showError("Invalid data format received from server.");
          setAttendanceRecords([]);
          return;
        }

        const attendanceList = studentsArray.map((student: any) => ({
          id: student.id || student.student_id || Math.random().toString(36).substr(2, 9),
          student_id: student.student_id || "",
          student_name: student.student_name || "Unknown",
          registration_number: student.registration_number || "N/A",
          is_present: student.is_present || false,
          class_name: className || student.class_name || "Unknown",
          section: student.section || section,
          date: formattedDate,
        }));

        setAttendanceRecords(attendanceList);
      } else if (response.status === 401) {
        handleUnauthorized();
      } else if (response.status === 500) {
        const errorData = await response.json();
        showError(errorData.error || "Server error occurred");
        setAttendanceRecords([]);
      } else {
        showError("Failed to fetch attendance records");
        setAttendanceRecords([]);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
      showError(`Error fetching attendance: ${error}`);
      setAttendanceRecords([]);
    } finally {
      setIsLoading(false);
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

  const handleDateChange = async (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      if (token && selectedClassId !== null && selectedSection) {
        await fetchAttendance(token, selectedClassId, selectedSection, date);
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-100 p-4">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-900">Attendance Report</h1>

        {isInitialLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        ) : !token ? (
          <div className="text-center text-red-600">
            <p>You are not logged in.</p>
            <p className="text-sm text-gray-500 mt-2">Please login to access the attendance report.</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center text-gray-700">
              <p><strong>Class:</strong> {className || "Not assigned"}</p>
              <p><strong>Section:</strong> {selectedSection || "Not assigned"}</p>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-blue-900">Date:</label>
                <DatePicker
                  selected={selectedDate}
                  onChange={handleDateChange}
                  className="p-2 border border-gray-300 rounded-md text-gray-500"
                  dateFormat="yyyy-MM-dd"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                {errorMessage}
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-4 border-blue-500 border-t-transparent"></div>
                <p className="mt-2 text-gray-600">Loading attendance data...</p>
              </div>
            ) : attendanceRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border rounded-lg shadow">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 border-b text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 border-b text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                        Class
                      </th>
                      <th className="px-6 py-3 border-b text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                        Section
                      </th>
                      <th className="px-6 py-3 border-b text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 border-b text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {attendanceRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 whitespace-nowrap text-gray-700">
                          {record.student_name}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-gray-700">
                          {record.class_name.replace(/\bclass\b/i, "Class")}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-gray-700">
                          {record.section.toUpperCase()}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              record.is_present
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {record.is_present ? "Present" : "Absent"}
                          </span>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-gray-700">
                          {format(new Date(record.date || selectedDate), "dd/MM/yyyy")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-gray-500 mt-4 p-8 bg-gray-50 rounded-lg">
                <p>No attendance data found for the selected date.</p>
                <p className="text-sm mt-2">Try selecting a different date.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentReportPage;