

"use client";

import React, { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import DashboardLayout from "@/app/dashboardComponents/DashboardLayout";

interface ClassInfo {
  key: string;
  class_name: string;
  section: string;
}

const AddHomeworkPage = () => {
  const router = useRouter();
  const [homework, setHomework] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [availableClasses, setAvailableClasses] = useState<ClassInfo[]>([]);
  const [selectedClassKey, setSelectedClassKey] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null); // ✅ PDF file state

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${baseUrl}/api/teachers/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const assigned = data.data.assigned_classes as any[];
        if (assigned?.length > 0) {
          const classes = assigned.map((cls) => ({
            key: `${cls.class_name} - ${cls.section}`,
            class_name: cls.class_name,
            section: cls.section,
          }));
          setAvailableClasses(classes);
          setSelectedClassKey(classes[0].key);
        } else {
          setError("No classes assigned.");
        }
      } else {
        setError("Failed to load classes.");
      }
    } catch (err) {
      setError("Error fetching classes.");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!homework) return setError("Homework details required.");
    if (!endDate || endDate < startDate)
      return setError("Please select a valid end date.");

    const token = localStorage.getItem("token");
    const selectedClass = availableClasses.find(
      (cls) => cls.key === selectedClassKey
    );
    if (!selectedClass) {
      return setError("Selected class not found.");
    }

    const formData = new FormData();
    formData.append("class_id", selectedClass.class_name);
    formData.append("homework", homework);
    formData.append("start_date", startDate.toISOString().split("T")[0]);
    formData.append("end_date", endDate.toISOString().split("T")[0]);

    if (pdfFile) {
      formData.append("homework_pdf", pdfFile); // ✅ field name must match multer
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${baseUrl}/api/homework`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // ❌ Do not manually set Content-Type when sending FormData
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Homework assigned successfully!");
        setTimeout(() => router.back(), 2000);
      } else {
        setError(data.message || "Failed to assign homework.");
      }
    } catch (err) {
      setError("Error submitting homework.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-teal-700 mb-4 text-blue-600">
          Assign Homework
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            {success}
          </div>
        )}

        {availableClasses.length === 0 ? (
          <p className="text-gray-500">Loading classes...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block font-semibold mb-1 text-gray-600">
                Select Class
              </label>
              <select
                className="w-full border rounded px-3 py-2 text-gray-500"
                value={selectedClassKey}
                onChange={(e) => setSelectedClassKey(e.target.value)}
                required
              >
                {availableClasses.map((cls) => (
                  <option key={cls.key} value={cls.key}>
                    {cls.key}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-gray-600">
                Homework Details
              </label>
              <textarea
                rows={5}
                value={homework}
                onChange={(e) => setHomework(e.target.value)}
                className="w-full border rounded px-3 py-2 text-gray-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-gray-600">
              Start Date
              </label>
             <DatePicker
             selected={startDate}
             onChange={(date) => setStartDate(date as Date)}
             dateFormat="dd/MM/yyyy"
             className="w-full border rounded px-3 py-2 text-gray-500"
             minDate={new Date()} // Restrict to current date or future dates
             />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-gray-600">
                End Date
              </label>
             <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                dateFormat="dd/MM/yyyy"
                className="w-full border rounded px-3 py-2 text-gray-500"
                minDate={startDate}
                placeholderText="Select end date"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-gray-600">
                Upload PDF (optional)
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && file.type === "application/pdf") {
                    setPdfFile(file);
                  } else {
                    setPdfFile(null);
                    alert("Only PDF files are allowed.");
                  }
                }}
                className="w-full border rounded px-3 py-2 text-gray-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-teal-600 text-white py-2 rounded hover:bg-teal-700 transition"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Assigning..." : "Assign Homework"}
            </button>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AddHomeworkPage;
