

"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/app/dashboardComponents/DashboardLayout";

const SendTextPage: React.FC = () => {
  const [message, setMessage] = useState<string>("");
  const [token, setToken] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState<string>("");
  const [studentId, setStudentId] = useState<number | null>(null);
  const [sentMessages, setSentMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get("classId");
  const section = searchParams.get("section");
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    console.log("Stored Token:", storedToken);
    setToken(storedToken);

    if (!storedToken) {
      console.log("No token found, redirecting to login");
      router.push("/login");
      return;
    }

    fetchTeacherName(storedToken);
    fetchSentMessages(storedToken);
  }, [classId, section, router]);

  const fetchTeacherName = async (authToken: string) => {
    try {
      const url = `${baseUrl}/api/dashboard/students`;
      console.log("Fetching teacher from URL:", url);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      console.log("Teacher API Response Status:", response.status);
      const data = await response.json();
      console.log("Teacher API Response Data:", JSON.stringify(data, null, 2));

      if (response.status === 200 && data.success && data.data?.length > 0) {
        const teacher = data.data[0];
        if (!teacher.student_id) {
          setErrorMessage("Student ID not found in API response");
          return;
        }
        setTeacherName(teacher.teacher_name || "Unknown Teacher");
        setStudentId(teacher.student_id);
        console.log("Teacher name set:", teacher.teacher_name, "Student ID set:", teacher.student_id);
      } else {
        const errorMsg = data.message || "No teachers found for this class and section";
        setErrorMessage(errorMsg);
        console.error("Teacher Error response:", errorMsg);
      }
    } catch (error: any) {
      const errorMsg = `Error fetching teacher: ${error.message || error}`;
      console.error("Teacher Fetch Error:", error);
      setErrorMessage(errorMsg);
    }
  };

  const fetchSentMessages = async (authToken: string) => {
    try {
      const url = `${baseUrl}/api/parent-get-messages`;
      console.log("Fetching sent messages from URL:", url);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      console.log("Sent Messages API Response Status:", response.status);
      const data = await response.json();
      console.log("Sent Messages API Response Data:", JSON.stringify(data, null, 2));

      if (response.status === 200) {
        setSentMessages(data);
      } else {
        const errorMsg = data.error || "Failed to fetch sent messages";
        setErrorMessage(errorMsg);
        console.error("Messages Error response:", errorMsg);
      }
    } catch (error: any) {
      const errorMsg = `Error fetching sent messages: ${error.message || error}`;
      console.error("Messages Fetch Error:", error);
      setErrorMessage(errorMsg);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!token) {
      setErrorMessage("No authentication token found");
      return;
    }

    try {
      const url = `${baseUrl}/api/parent-delete-message/${messageId}`;
      console.log("Deleting message from URL:", url);
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Delete Message Response Status:", response.status);
      const data = await response.json();
      console.log("Delete Message Response Data:", JSON.stringify(data, null, 2));

      if (response.status === 200) {
        setSentMessages(sentMessages.filter((msg) => msg.id !== messageId));
        alert("Message deleted successfully");
      } else {
        setErrorMessage(data.error || "Failed to delete message");
        console.error("Delete Message Error Response:", data.error);
      }
    } catch (error: any) {
      const errorMsg = error.message || "Failed to delete message (network or server error)";
      console.error("Delete Message Error:", error);
      setErrorMessage(errorMsg);
    }
  };

  const handleSendMessage = async () => {
    console.log("handleSendMessage Inputs:", { token, studentId, message, messageLength: message.length });

    if (!token) {
      setErrorMessage("No authentication token found");
      return;
    }
    if (!studentId) {
      setErrorMessage("Student ID is missing");
      return;
    }
    if (!message.trim()) {
      setErrorMessage("Message cannot be empty");
      return;
    }
    if (message.length > 200) {
      setErrorMessage("Message exceeds 200 character limit");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/parent-send-message`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          student_id: Number(studentId),
          message: message,
        }),
      });

      const data = await response.json();
      console.log("Send Message Response:", data);
      if (response.status === 200) {
        alert("Message sent successfully");
        setMessage("");
        fetchSentMessages(token);
      } else {
        setErrorMessage(data.error || "Failed to send message");
      }
    } catch (error: any) {
      setErrorMessage(`Error sending message: ${error.message || error}`);
      console.error("Send Message Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-b from-white to-white p-6">
        <h1 className="text-2xl font-bold text-blue-900 mb-6 text-center">
          Connect with Class Teacher {teacherName || "Loading..."}
        </h1>

        {errorMessage && (
          <div className="bg-red-600 text-white p-3 rounded mb-4 w-full text-center">
            {errorMessage}
          </div>
        )}

        {/* Send Message Section */}
        <div className="bg-white bg-opacity-10 border-blue-300 border-4 backdrop-blur-md p-6 rounded-lg shadow-xl mb-8">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 200))}
            placeholder="Type your message here..."
            className="w-full h-40 p-4 border border-white border-opacity-20 rounded-lg text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex justify-between items-center mt-4">
            <span className="text-gray-700 text-sm">{message.length}/200</span>
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

        {/* Sent Messages Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Sent Messages</h2>
          {sentMessages.length === 0 ? (
            <p className="text-gray-700">No messages sent yet.</p>
          ) : (
            <div className="space-y-4">
              {sentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="relative bg-blue-300 p-4 rounded-lg border border-white border-opacity-20 flex justify-between items-start"
                >
                  <div>
                    <p className="text-gray-900 font-medium">
                      To: Class Teacher {teacherName}
                    </p>
                    <p className="text-gray-900 mt-1">{msg.message}</p>
                    <p className="text-gray-600 text-sm mt-2">
                      Sent: {new Date(msg.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteMessage(msg.id)}
                    className="text-red-600 hover:text-red-800 text-xl"
                    title="Delete Message"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SendTextPage;

//bg-white bg-opacity-20 border border-gray-300 rounded-lg p-4 shadow-md flex justify-between items-start