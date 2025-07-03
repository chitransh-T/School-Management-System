

"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/app/dashboardComponents/DashboardLayout";

const SendTextPage: React.FC = () => {
  const [message, setMessage] = useState<string>("");
  const [token, setToken] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId");
  const studentNameParam = searchParams.get("studentName");
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
    if (studentNameParam) {
      setStudentName(decodeURIComponent(studentNameParam));
    } else if (storedToken && studentId) {
      console.log("Fetching student with ID:", studentId); // Debug log
      fetchStudentName(storedToken, studentId);
    } else if (!storedToken) {
      router.push("/login");
    }
  }, [studentId, studentNameParam, router]);

  const fetchStudentName = async (authToken: string, id: string) => {
    try {
      const response = await fetch(`${baseUrl}/api/students/${id}`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      console.log("API Response Status:", response.status); // Debug log
      const data = await response.json();
      console.log("API Response Data:", data); // Debug log

      if (response.status === 200) {
        const extractedName = data.student_name ?? data.name ?? (data.data && (data.data.student_name ?? data.data.name));
        setStudentName(extractedName || "Unknown Student");
      } else {
        setErrorMessage("Failed to fetch student details");
      }
    } catch (error: any) {
      console.error("Fetch Error:", error); // Debug log
      setErrorMessage(`Error fetching student: ${error.message || error}`);
    }
  };

  const handleSendMessage = async () => {
    if (!token || !studentId || message.length > 200) {
      setErrorMessage("Invalid input or missing token");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/send-message`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          student_id: Number(studentId), // Convert studentId to number
          message: message,
        }),
      });

      const data = await response.json(); // Parse response to get detailed error
      if (response.status === 200) {
        alert("Message sent successfully");
        router.push("/MessagesControl/viewmessage");
      } else {
        setErrorMessage(data.error || "Failed to send message");
      }
    } catch (error: any) {
      setErrorMessage(`Error sending message: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-b from-white to-white p-6">
        <h1 className="text-2xl font-bold text-blue-900 mb-6 text-center">
          Connect with parents of {studentName || "Loading..."}
        </h1>

        {errorMessage && (
          <div className="bg-red-600 text-white p-3 rounded mb-4 w-full text-center">
            {errorMessage}
          </div>
        )}

        <div className="bg-white bg-opacity-10 border-blue-500 border-4 backdrop-blur-md p-6 rounded-lg shadow-xl">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 200))}
            placeholder="Type your message here..."
            className="w-full h-40 p-4 border border-white border-opacity-20 rounded-lg text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex justify-between items-center mt-4">
            <span className="text-gray-700 text-sm">
              {message.length}/200
            </span>
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !message.trim()}
              className={`px-6 py-2 rounded-lg text-white ${
                isLoading || !message.trim()
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SendTextPage;