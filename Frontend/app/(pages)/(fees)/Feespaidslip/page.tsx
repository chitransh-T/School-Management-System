

"use client";

import React, { useRef, useEffect, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import DashboardLayout from "@/app/dashboardComponents/DashboardLayout";
import { useRouter } from "next/navigation";
import axios from "axios";

const FeesReceiptPage = () => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [receiptData, setReceiptData] = useState({
    registrationId: "",
    className: "",
    name: "",
    feeMonth: "",
    totalAmount: 0,
    deposit: 0,
    remainings: 0,
  });
  const [loading, setLoading] = useState(true);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  useEffect(() => {
    const fetchData = async () => {
      const query = new URLSearchParams(window.location.search);
      const data = query.get("data");
      const studentId = window.location.pathname.split("/").pop();

      if (data) {
        // Data passed via query parameter
        try {
          const parsedData = JSON.parse(decodeURIComponent(data));
          setReceiptData(parsedData);
          setLoading(false);
        } catch (error) {
          console.error("Error parsing query data:", error);
        }
      } else if (studentId) {
        // Fetch data from backend
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(`${baseUrl}/api/summary/${studentId}`, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': token || '',
            },
          });

          const summary = response.data.data[0] || {};
          const studentResponse = await axios.get(`${baseUrl}/api/students/${encodeURIComponent(studentId)}`, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': token || '',
            },
          });

          const student = studentResponse.data[0] || {};
          setReceiptData({
            registrationId: studentId,
            className: student.className || "",
            name: student.student_name || "",
            feeMonth: summary.last_payment_month || "Unknown",
            totalAmount: summary.total_charged || 0,
            deposit: summary.total_deposit || 0,
            remainings: summary.last_due_balance || 0,
          });
          setLoading(false);
        } catch (error) {
          console.error("Error fetching receipt data:", error);
          setLoading(false);
        }
      }
    };

    fetchData();
  }, []);

  const handleDownload = () => {
    if (receiptRef.current) {
      html2canvas(receiptRef.current).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save("fees_receipt.pdf");
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-100 p-8">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-700">Fees - Fees paid receipt</h2>
          <div className="space-x-2">
            <button
              onClick={handleDownload}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded shadow"
            >
              Download Receipt
            </button>
          </div>
        </div>

        <div
          ref={receiptRef}
          className="bg-white p-8 max-w-2xl mx-auto rounded-xl shadow-md"
        >
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full mb-2">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M9 14l2-2 4 4M7 10h10M5 6h14M5 18h14" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Fees Paid Receipt</h1>
          </div>

          <div className="space-y-3 text-gray-700">
            <ReceiptRow label="Registration/ID" value={receiptData.registrationId} />
            <ReceiptRow label="Class" value={receiptData.className} />
            <ReceiptRow label="Name" value={receiptData.name} />
            <ReceiptRow label="Fee Month" value={receiptData.feeMonth} />
            <ReceiptRow label="Total Amount" value={`$ ${receiptData.totalAmount}`} />
            <ReceiptRow label="Deposit" value={`$ ${receiptData.deposit}`} />
            <ReceiptRow label="Remainings" value={`$ ${receiptData.remainings}`} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

const ReceiptRow = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex justify-between bg-gray-100 px-4 py-2 rounded">
    <span className="font-medium">{label}</span>
    <span className="font-semibold text-gray-800">{value}</span>
  </div>
);

export default FeesReceiptPage;


