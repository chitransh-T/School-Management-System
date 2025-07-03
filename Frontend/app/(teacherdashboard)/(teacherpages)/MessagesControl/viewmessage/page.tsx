

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/app/dashboardComponents/DashboardLayout";

const ViewMessagesPage: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const token = localStorage.getItem("token");
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    fetchMessages();
  }, [token, router]);

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/sent-messages`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log("API Response Data:", data); // Debug log

      if (response.status === 200) {
        setMessages(data);
      } else {
        setErrorMessage("Failed to fetch sent messages");
      }
    } catch (error: any) {
      console.error("Fetch Error:", error); // Debug log
      setErrorMessage(`Error fetching messages: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!token) {
      setErrorMessage("No token available");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/sent-messages/${messageId}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        setMessages(messages.filter((msg) => msg.id !== messageId));
        alert("Message deleted successfully");
      } else {
        const data = await response.json();
        setErrorMessage(data.error || "Failed to delete message");
      }
    } catch (error: any) {
      setErrorMessage(`Error deleting message: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    }).replace(',', ',');
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-b from-white to-white p-6">
        <h1 className="text-2xl font-bold text-blue-900 mb-6 text-center">
          Messages Sent to Parents
        </h1>

        {errorMessage && (
          <div className="bg-red-600 text-white p-3 rounded mb-4 w-full text-center">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="text-center text-gray-700">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-700">No messages sent yet.</div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="relative bg-blue-400 p-4 rounded-lg border border-white border-opacity-20"
              >
                <div>
                  <div className="text-white text-sm">
                    Message sent to parents of {msg.student_name || "Unknown Student"}
                  </div>
                  <div className="text-white text-lg">{msg.message}</div>
                </div>
                <div className="absolute top-2 right-2">
                  <button
                    onClick={() => handleDeleteMessage(msg.id)}
                    className="text-white text-xl hover:text-red-500 focus:outline-none"
                  >
                    🗑️
                  </button>
                </div>
                <div className="text-white text-xs mt-2">
                  {formatTimestamp(msg.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ViewMessagesPage;