

"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/app/dashboardComponents/DashboardLayout";
import { format } from "date-fns";

interface Student {
  id: string;
  student_name: string;
  registration_number: string;
  assigned_class: string;
  assigned_section: string;
  status: string;
  date: string;
}

interface ClassData {
  id: number;
  class_name: string;
  section: string;
}

const AttendanceReport = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedClassName, setSelectedClassName] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [attendanceData, setAttendanceData] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [classError, setClassError] = useState("");
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  // Fetch classes from the backend
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoadingClasses(true);
        setClassError("");

        const token = localStorage.getItem("token");
        if (!token) {
          setClassError("Authentication token not found");
          return;
        }

        const response = await fetch(`${baseUrl}/api/classes`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch classes: ${response.status}`);
        }

        const data: ClassData[] = await response.json();
        console.log("Classes data received:", data);

        setClasses(data);
        const uniqueClasses = Array.from(new Set(data.map((cls) => cls.class_name))) as string[];
        setAvailableClasses(uniqueClasses);
        
        // Don't set all sections initially - wait for class selection
        setAvailableSections([]);
      } catch (err) {
        console.error("Error fetching classes:", err);
        setClassError("Failed to load classes. Please try again.");
        setAvailableClasses(Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`));
        setAvailableSections(["A", "B", "C"]);
      } finally {
        setLoadingClasses(false);
      }
    };

    fetchClasses();
  }, []);

  // Update available sections when a class is selected
  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedClassName = e.target.value;
    setSelectedClassName(selectedClassName);
    setSelectedSection(""); // Reset section when class changes

    if (selectedClassName) {
      // Find the class ID for the selected class name
      const classData = classes.find((cls) => cls.class_name === selectedClassName);
      setSelectedClassId(classData ? classData.id : null);

      // Filter sections for the selected class only
      const filteredSections = classes
        .filter((cls) => cls.class_name === selectedClassName)
        .map((cls) => cls.section);
      
      // Remove duplicates and sort
      const uniqueSections = Array.from(new Set(filteredSections)).sort();
      setAvailableSections(uniqueSections);
      
      console.log("Selected class:", selectedClassName);
      console.log("Available sections for this class:", uniqueSections);
    } else {
      // Reset when no class is selected
      setSelectedClassId(null);
      setAvailableSections([]);
    }
  };

  const handleSectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSectionValue = e.target.value;
    setSelectedSection(selectedSectionValue);
    
    // Update the class ID based on the selected class and section combination
    if (selectedClassName && selectedSectionValue) {
      const classData = classes.find(
        (cls) => cls.class_name === selectedClassName && cls.section === selectedSectionValue
      );
      setSelectedClassId(classData ? classData.id : null);
      
      console.log("Selected section:", selectedSectionValue);
      console.log("Class ID for this combination:", classData?.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!selectedClassId || !selectedSection) {
      setError("Please select both class and section");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      console.log("Fetching attendance with params:", { 
        selectedClassId, 
        selectedClassName,
        selectedSection, 
        selectedDate 
      });
      
      const url = `${baseUrl}/api/attendance/${selectedClassId}/${encodeURIComponent(selectedSection)}/${encodeURIComponent(selectedDate)}`;
      console.log("Request URL:", url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log("Response status:", response.status);

      if (response.status === 200) {
        const data = await response.json();
        console.log("Response data:", data);

        if (data.message && data.students.length === 0) {
          setError(data.message);
          setAttendanceData([]);
          return;
        }

        const studentsArray = data.students || [];
        if (!Array.isArray(studentsArray)) {
          throw new Error("Invalid student data format from server");
        }

        const formattedData = studentsArray.map((student: any) => ({
          id: student.id || student.student_id || Math.random().toString(36).substr(2, 9),
          student_name: student.student_name || "Unknown",
          assigned_class: selectedClassName || student.class_name || "Unknown",
          assigned_section: student.section || selectedSection,
          status: student.is_present ? "Present" : "Absent",
          date: selectedDate,
        }));
        
        console.log("Formatted attendance data:", formattedData);
        setAttendanceData(formattedData as Student[]);
      } else if (response.status === 500) {
        const errorData = await response.json();
        setError(errorData.error || "Server error occurred");
        setAttendanceData([]);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to fetch attendance data");
        setAttendanceData([]);
      }
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setError(err instanceof Error ? err.message : "Failed to load attendance data");
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex-1 p-6 max-w-6xl mx-auto my-12">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-700">Attendance Report</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-2 border rounded-md text-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                {loadingClasses ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-sm text-gray-500">Loading classes...</span>
                  </div>
                ) : (
                  <select
                    value={selectedClassName}
                    onChange={handleClassChange}
                    className="w-full p-2 border rounded-md text-gray-700"
                    required
                  >
                    <option value="">Select Class</option>
                    {availableClasses.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                )}
                {classError && <p className="text-red-500 text-xs mt-1">{classError}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                {loadingClasses ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-sm text-gray-500">Loading sections...</span>
                  </div>
                ) : (
                  <select
                    value={selectedSection}
                    onChange={handleSectionChange}
                    className="w-full p-2 border rounded-md text-gray-700"
                    required
                    disabled={!selectedClassName}
                  >
                    <option value="">Select Section</option>
                    {availableSections.map((section) => (
                      <option key={section} value={section}>
                        {typeof section === "string" && section.length === 1 ? section.toUpperCase() : section}
                      </option>
                    ))}
                  </select>
                )}
                {!selectedClassName && (
                  <p className="text-gray-500 text-xs mt-1">Please select a class first</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <button
                type="submit"
                disabled={loading || !selectedClassId || !selectedSection}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Loading..." : "View Report"}
              </button>
            </div>
          </form>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-2 text-gray-600">Loading attendance data...</p>
            </div>
          ) : attendanceData.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  Attendance Report Summary
                </h3>
                <p className="text-sm text-blue-700">
                  Class: <span className="font-medium">{selectedClassName}</span> | 
                  Section: <span className="font-medium">{selectedSection}</span> | 
                  Date: <span className="font-medium">{format(new Date(selectedDate), "dd/MM/yyyy")}</span>
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Total Students: <span className="font-medium">{attendanceData.length}</span> | 
                  Present: <span className="font-medium text-green-600">
                    {attendanceData.filter(s => s.status === "Present").length}
                  </span> | 
                  Absent: <span className="font-medium text-red-600">
                    {attendanceData.filter(s => s.status === "Absent").length}
                  </span>
                </p>
              </div>
              
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Section
                    </th>
                    <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attendanceData.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700 font-medium">
                        {student.student_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {student.assigned_class.replace(/\bclass\b/i, "Class")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {student.assigned_section.toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            student.status === "Present"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {format(new Date(student.date), "dd/MM/yyyy")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-4 p-8 bg-gray-50 rounded-lg">
              <p>No attendance data found for the selected criteria</p>
              <p className="text-sm mt-2">Try selecting a different date, class, or section</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AttendanceReport;