'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';

interface FeeItem {
  fee_name: string;
  amount: number;
}

interface ReceiptData {
  studentId: string;
  studentName: string;
  studentClass: string;
  studentSection: string;
  feeMonths: string[];
  totalPaid: number;
  totalDue: number;
  depositAmount: number;
  paymentDate: string;
  remark: string;
  isYearlyPayment: boolean;
  feeItems: FeeItem[];
}

const FeeReceiptPage: React.FC = () => {
  const searchParams = useSearchParams();
  const dataParam = searchParams.get('data');
  const receiptData: ReceiptData = dataParam
    ? JSON.parse(decodeURIComponent(dataParam))
    : {
        studentId: '',
        studentName: 'Unknown',
        studentClass: 'N/A',
        studentSection: 'N/A',
        feeMonths: [],
        totalPaid: 0,
        totalDue: 0,
        depositAmount: 0,
        paymentDate: new Date().toISOString().split('T')[0],
        remark: '',
        isYearlyPayment: false,
        feeItems: [],
      };

  const {
    studentId,
    studentName,
    studentClass,
    studentSection,
    feeMonths,
    totalPaid,
    totalDue,
    depositAmount,
    paymentDate,
    remark,
    isYearlyPayment,
    feeItems,
  } = receiptData;

  const [instituteName, setInstituteName] = useState<string>('ALMANET SCHOOL');
  const [logoUrlFull, setLogoUrlFull] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found, cannot fetch profile');
          setIsLoading(false);
          return;
        }

        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const innerData = response.data.data;
        if (innerData) {
          setInstituteName(innerData.institute_name || 'ALMANET SCHOOL');
          const logoUrl = innerData.logo_url || '';
          if (logoUrl) {
            const cleanBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.endsWith('/')
              ? process.env.NEXT_PUBLIC_API_BASE_URL.slice(0, -1)
              : process.env.NEXT_PUBLIC_API_BASE_URL;
            const cleanLogoUrl = logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`;
            setLogoUrlFull(logoUrl.startsWith('http') ? logoUrl : `${cleanBaseUrl}${cleanLogoUrl}`);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setInstituteName('ALMANET SCHOOL');
        setLogoUrlFull(null);
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, []);
  const generatePDF = async () => {
    const doc = new jsPDF();
    let logoImage: string | null = null;
  
    if (logoUrlFull) {
      try {
        const img = await fetch(logoUrlFull).then((res) => res.blob());
        logoImage = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(img);
        });
      } catch (error) {
        console.error('Failed to load logo image:', error);
      }
    }
  
    // Header
    if (logoImage) {
      const pageWidth = doc.internal.pageSize.width;
      const imageWidth = 20;
      const x = (pageWidth - imageWidth) / 2; // Center the image
      doc.addImage(logoImage, 'PNG', x, 10, imageWidth, 20); // Centered image
    } else {
      const pageWidth = doc.internal.pageSize.width;
      const circleX = pageWidth / 2; // Center the circle
      doc.setFillColor(173, 216, 230);
      doc.circle(circleX, 20, 10, 'F');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 139);
      doc.text('AS', circleX - 2, 22); // Adjust text position slightly
    }
  
    // Move text below the image
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 139);
    doc.text(instituteName, doc.internal.pageSize.width / 2, 40, { align: 'center' }); // Centered text
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Excellence in Education', doc.internal.pageSize.width / 2, 47, { align: 'center' }); // Centered text
  
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('FEE RECEIPT', doc.internal.pageSize.width / 2, 60, { align: 'center' });
    // Student Information Table
    autoTable(doc, {
      startY: 70, // Adjusted startY to account for the new header layout
      head: [['Student Name', studentName], ['Class', studentClass], ['Section', studentSection]],
      styles: { fontSize: 10, cellPadding: 2, textColor: [0, 0, 139] },
      headStyles: { fillColor: [240, 248, 255], textColor: [0, 0, 139] },
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 100 } },
    });
  
    // Payment Details Table
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [
        ['Payment Date', paymentDate],
        ['Payment Type', isYearlyPayment ? 'Yearly' : 'Monthly'],
        ['Fee Months', feeMonths.length ? feeMonths.join(', ') : 'N/A'],
      ],
      styles: { fontSize: 10, cellPadding: 2, textColor: [0, 0, 139] },
      headStyles: { fillColor: [240, 248, 255], textColor: [0, 0, 139] },
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 100 } },
    });
  
    // Fee Breakdown Table
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Fee Name', 'Amount']],
      body: feeItems.map((item) => [item.fee_name || 'Unknown', `Rs.${item.amount.toFixed(2)}`]),
      styles: { fontSize: 10, cellPadding: 2, textColor: [0, 0, 139] },
      headStyles: { fillColor: [240, 248, 255], textColor: [0, 0, 139] },
      columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 50 } },
    });
  
    // Summary Table
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [
        ['Total Amount', `Rs.${depositAmount.toFixed(2)}`],
        ['Total Paid (Cumulative)', `Rs.${totalPaid.toFixed(2)}`],
        ['Total Due', `Rs.${totalDue.toFixed(2)}`],
      ],
      styles: { fontSize: 10, cellPadding: 2, textColor: [0, 0, 139] },
      headStyles: { fillColor: [240, 248, 255], textColor: [0, 0, 139] },
      columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 100 } },
    });
  
    // Signature Fields
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(8);
    doc.line(30, finalY, 80, finalY);
    doc.text('Principal Signature', 55, finalY + 5, { align: 'center' });
    doc.line(130, finalY, 180, finalY);
    doc.text('School Stamp', 155, finalY + 5, { align: 'center' });
  
    doc.save('Fee_Receipt.pdf');
  };
  const buildTableCell = (text: string, isHeader: boolean, statusColor?: string) => (
    <td className={`p-3 ${isHeader ? 'bg-blue-50 font-semibold' : 'bg-white'} ${statusColor || 'text-blue-800'}`}>
      {text}
    </td>
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-100 py-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* School Header */}
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <div className="flex justify-center items-center">
                {logoUrlFull ? (
                  <Image
                    src={logoUrlFull}
                    alt="School Logo"
                    width={72}
                    height={72}
                    className="rounded-full object-cover"
                    onError={() => (
                      <div className="w-18 h-18 bg-blue-200 rounded-full flex items-center justify-center">
                        <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.747 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    )}
                  />
                ) : (
                  <div className="w-18 h-18 bg-blue-200 rounded-full flex items-center justify-center">
                    <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.747 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                )}
              </div>
              <h1 className="text-2xl font-bold text-blue-900 mt-2">{instituteName}</h1>
              <p className="text-blue-900">Excellence in Education</p>
            </div>

            <h2 className="text-2xl font-bold text-blue-900 text-center">FEE RECEIPT</h2>

            {/* Student Information */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="w-full border border-blue-100">
                <tbody>
                  <tr className="bg-blue-50">
                    {buildTableCell('Student Name', true)}
                    {buildTableCell(studentName, false)}
                  </tr>
                  <tr>
                    {buildTableCell('Class', true)}
                    {buildTableCell(studentClass, false)}
                  </tr>
                  <tr>
                    {buildTableCell('Section', true)}
                    {buildTableCell(studentSection, false)}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Payment Details */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="w-full border border-blue-100">
                <tbody>
                  <tr className="bg-blue-50">
                    {buildTableCell('Payment Date', true)}
                    {buildTableCell(paymentDate, false)}
                  </tr>
                  <tr>
                    {buildTableCell('Payment Type', true)}
                    {buildTableCell(isYearlyPayment ? 'Yearly' : 'Monthly', false)}
                  </tr>
                  <tr>
                    {buildTableCell('Fee Months', true)}
                    {buildTableCell(feeMonths.length ? feeMonths.join(', ') : 'N/A', false)}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Fee Breakdown */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="w-full border border-blue-100">
                <thead>
                  <tr className="bg-blue-50">
                    {buildTableCell('Fee Name', true)}
                    {buildTableCell('Amount', true)}
                  </tr>
                </thead>
                <tbody>
                  {feeItems.map((item, index) => (
                    <tr key={index}>
                      {buildTableCell(item.fee_name || 'Unknown', false)}
                      {buildTableCell(`₹${item.amount.toFixed(2)}`, false)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="w-full border border-blue-100">
                <tbody>
                  <tr className="bg-blue-50">
                    {buildTableCell('Total Amount', true)}
                    {buildTableCell(`₹${depositAmount.toFixed(2)}`, false)}
                  </tr>
                  <tr>
                    {buildTableCell('Total Paid (Cumulative)', true)}
                    {buildTableCell(`₹${totalPaid.toFixed(2)}`, false, 'text-green-600')}
                  </tr>
                  <tr>
                    {buildTableCell('Total Due', true)}
                    {buildTableCell(`₹${totalDue.toFixed(2)}`, false, 'text-red-600')}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Remark */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="w-full border border-blue-100">
                <tbody>
                  <tr className="bg-blue-50">
                    {buildTableCell('Remark', true)}
                    {buildTableCell(remark || 'N/A', false)}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Print Button */}
            <div className="text-center">
              <button
                onClick={generatePDF}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center mx-auto"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
            </div>

            {/* Footer */}
            <div className="bg-blue-50 shadow rounded-lg p-4 text-center text-blue-700 italic">
              Thank you for your payment!
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FeeReceiptPage;