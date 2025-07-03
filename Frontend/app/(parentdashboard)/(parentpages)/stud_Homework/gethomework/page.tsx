

"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import DashboardLayout from "@/app/dashboardComponents/DashboardLayout";

interface HomeworkItem {
  id: number;
  class_id: string;
  subject_name?: string;
  homework: string;
  start_date: string;
  end_date: string;
  pdf_file_path?: string;
}

const ViewHomeworkPage = () => {
  const [homeworkList, setHomeworkList] = useState<HomeworkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  useEffect(() => {
    fetchHomework();
  }, []);

  const fetchHomework = async () => {
    setIsLoading(true);
    setError("");

    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${baseUrl}/api/gethomeworkforparent`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await res.json();
      const homework = Array.isArray(data) ? data : data.data;
      setHomeworkList(homework || []);
    } catch (e) {
      setError("Error fetching homework.");
    } finally {
      setIsLoading(false);
    }
  };

  const openPdfInNewTab = (pdfPath: string) => {
    const fileName = encodeURIComponent(pdfPath.split("/").pop() || "");
    const pdfUrl = `${baseUrl}/Uploads/${fileName}`;
    window.open(pdfUrl, "_blank");
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-teal-700 mb-4">Homework</h1>

        {isLoading ? (
          <p className="text-gray-500">Loading...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : homeworkList.length === 0 ? (
          <p className="text-gray-500">No homework assigned.</p>
        ) : (
          <div className="space-y-4">
            {homeworkList.map((hw, index) => {
              const startDate = new Date(hw.start_date);
              const endDate = new Date(hw.end_date);

              return (
                <div
                  key={hw.id || `hw-${index}`}
                  className="bg-white shadow rounded p-4 border"
                >
                  <p className="font-semibold text-teal-700 mb-1">
                    Subject: {hw.subject_name || "N/A"}
                  </p>
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {hw.homework}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Class: {hw.class_id}
                  </p>
                  <p className="text-sm text-gray-500">
                    From: {format(startDate, "PPP")}   To:{" "}
                    {format(endDate, "PPP")}
                  </p>

                  {hw.pdf_file_path && (
                    <button
                      onClick={() => openPdfInNewTab(hw.pdf_file_path!)}
                      className="mt-2 inline-block text-blue-600 hover:underline text-sm"
                    >
                      📄 View PDF
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ViewHomeworkPage;