'use client';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
import React, { useState, useEffect } from 'react';
import { 
  AcademicCapIcon, 
  UserIcon, 
  PrinterIcon, 
  ClipboardDocumentIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';

// Student interface (matching the one from the previous component)
interface Student {
  id: string;
  name: string;
  registrationNumber: string;
  className: string;
  assignedSection: string;
  studentPhoto: string;
  admissionDate: Date;
  username: string;
  password: string;
}

const AdmissionConfirmationPage: React.FC = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Load student data from localStorage on component mount
  useEffect(() => {
    try {
      const storedStudentData = localStorage.getItem('selectedStudent');
      if (storedStudentData) {
        const parsedStudent = JSON.parse(storedStudentData);
        // Ensure the admissionDate is a Date object
        if (parsedStudent.admissionDate) {
          parsedStudent.admissionDate = new Date(parsedStudent.admissionDate);
        }
        setStudent(parsedStudent);
      } else {
        setError('No student data found. Please select a student from the admission page.');
      }
    } catch (err) {
      console.error('Error loading student data:', err);
      setError('Error loading student data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const buildStudentPhoto = () => {
    if (!student || !student.studentPhoto) {
      return (
        <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-200">
          <UserIcon className="h-12 w-12 text-blue-900" />
        </div>
      );
    }

    // At this point we know student exists and has a studentPhoto
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const fullPhotoPath = student.studentPhoto.startsWith('http') 
      ? student.studentPhoto 
      : `${baseUrl}/uploads/${student.studentPhoto}`;

    return (
      <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-blue-200">
        <img
          src={fullPhotoPath}
          alt="Student"
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            if (target.parentElement) {
              target.parentElement.innerHTML = `
                <div class="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-200">
                  <svg class="h-12 w-12 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              `;
            }
          }}
        />
      </div>
    );
  };

  const TableRow: React.FC<{
    label: string;
    value: string;
    copyEnabled?: boolean;
    isPassword?: boolean;
    isStatus?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
  }> = ({ label, value, copyEnabled = false, isPassword = false, isStatus = false, isFirst = false, isLast = false }) => {
    const displayValue = isPassword && !showPassword ? '••••••••' : value;
    const isCopied = copiedField === label;

    return (
      <tr className={`${isFirst ? 'first:rounded-t-lg' : ''} ${isLast ? 'last:rounded-b-lg' : ''}`}>
        <td className={`px-4 py-3 font-bold text-blue-900 bg-blue-50 border-b border-blue-100 ${isFirst ? 'rounded-tl-lg' : ''} ${isLast ? 'rounded-bl-lg' : ''}`}>
          {label}
        </td>
        <td className={`px-4 py-3 text-blue-800 border-b border-blue-100 ${isFirst ? 'rounded-tr-lg' : ''} ${isLast ? 'rounded-br-lg' : ''}`}>
          <div className="flex items-center justify-between">
            <span className="flex-1">
              {isStatus ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                  <CheckCircleIcon className="h-3 w-3 mr-1" />
                  {displayValue}
                </span>
              ) : (
                displayValue
              )}
            </span>
            {copyEnabled && (
              <button
                onClick={() => copyToClipboard(value, label)}
                className="ml-2 p-1 text-blue-800 hover:text-blue-600 transition-colors duration-200"
                title="Copy to clipboard"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
                {isCopied && (
                  <span className="absolute ml-2 text-xs text-green-600 font-medium">
                    Copied!
                  </span>
                )}
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const generatePDF = async () => {
    if (!student) return;
    try {
      // Create new jsPDF instance
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Colors
      const blueColor = [59, 130, 246]; // blue-500
      const darkBlueColor = [30, 64, 175]; // blue-800

      // Header background
      pdf.setFillColor(239, 246, 255); // blue-50
      pdf.roundedRect(10, 10, pageWidth - 20, 50, 5, 5, 'F');

      // School logo placeholder (circle)
      pdf.setFillColor(191, 219, 254); // blue-200
      pdf.circle(pageWidth / 2, 25, 8, 'F');
      pdf.setTextColor(0, 51, 102);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AS', pageWidth / 2, 27, { align: 'center' });

      // School name
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 51, 102);
      pdf.text('ALMANET SCHOOL', pageWidth / 2, 40, { align: 'center' });

      // School tagline
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Excellence in Education', pageWidth / 2, 48, { align: 'center' });

      // Title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ADMISSION CONFIRMATION', pageWidth / 2, 75, { align: 'center' });

      // Student photo placeholder
      pdf.setDrawColor(0, 51, 102);
      pdf.setLineWidth(1);
      pdf.circle(pageWidth / 2, 100, 15);
      pdf.setFontSize(8);
      pdf.text('PHOTO', pageWidth / 2, 102, { align: 'center' });

      // Student information table
      let yPosition = 130;
      const leftColumn = 20;
      const rightColumn = 80;
      const rowHeight = 12;

      const tableData = [
        ['Student Name', student.name || ''],
        ['Registration/ID', student.registrationNumber || ''],
        ['Class', `${student.className || ''} - ${student.assignedSection || ''}`],
        ['Admission Date', student.admissionDate ? formatDate(student.admissionDate) : ''],
        ['Account Status', 'Active'],
        ['Username', student.username || ''],
        ['Password', student.password || '']
      ];

      // Table border
      pdf.setDrawColor(191, 219, 254); // blue-200
      pdf.setLineWidth(0.5);
      pdf.roundedRect(leftColumn - 5, yPosition - 5, pageWidth - 30, tableData.length * rowHeight + 10, 3, 3);

      tableData.forEach((row, index) => {
        const isEvenRow = index % 2 === 0;
        
        // Row background
        if (isEvenRow) {
          pdf.setFillColor(239, 246, 255); // blue-50
          pdf.rect(leftColumn - 4, yPosition - 3, pageWidth - 32, rowHeight - 2, 'F');
        }

        // Label
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(0, 51, 102);
        pdf.text(row[0], leftColumn, yPosition + 3);

        // Value
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(59, 130, 246); // blue-500
        
        if (row[0] === 'Account Status') {
          pdf.setFillColor(220, 252, 231); // green-100
          pdf.setTextColor(22, 101, 52); // green-800
          pdf.roundedRect(rightColumn, yPosition - 2, 25, 8, 2, 2, 'F');
          pdf.text(row[1], rightColumn + 12.5, yPosition + 3, { align: 'center' });
        } else if (row[0] === 'Password') {
          pdf.text('••••••••', rightColumn, yPosition + 3);
        } else {
          pdf.text(row[1], rightColumn, yPosition + 3);
        }

        yPosition += rowHeight;
      });

      // Signatures
      yPosition += 30;
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      
      // Principal signature line
      pdf.line(30, yPosition, 80, yPosition);
      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Principal Signature', 55, yPosition + 8, { align: 'center' });

      // School stamp line
      pdf.line(pageWidth - 80, yPosition, pageWidth - 30, yPosition);
      pdf.text('School Stamp', pageWidth - 55, yPosition + 8, { align: 'center' });

      // Important note
      yPosition += 30;
      pdf.setFillColor(239, 246, 255); // blue-50
      pdf.roundedRect(20, yPosition, pageWidth - 40, 25, 3, 3, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 51, 102);
      pdf.text('Important Note:', pageWidth / 2, yPosition + 8, { align: 'center' });
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      const noteText = 'Please keep this admission letter for your records. Your username and password will be required to access the student portal.';
      const splitText = pdf.splitTextToSize(noteText, pageWidth - 50);
      pdf.text(splitText, pageWidth / 2, yPosition + 15, { align: 'center' });

      // Save the PDF
      pdf.save(`admission_letter_${student.name?.replace(/\s+/g, '_') || 'student'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  // Early return if loading or error/no student data
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-500 text-center mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-center text-gray-800 mb-4">Error Loading Student Data</h2>
          <p className="text-gray-600 text-center">{error || 'No student data available'}</p>
          <div className="mt-6 text-center">
            <a href="/studentadmission" className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
              Return to Student List
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="bg-blue-600 text-white py-4 px-6">
        <h1 className="text-xl font-semibold text-center">Admission Confirmation</h1>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <div className="space-y-6">
          {/* School Header */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-blue-50 px-6 py-8 text-center">
              <AcademicCapIcon className="h-12 w-12 text-blue-900 mx-auto mb-3" />
              <h1 className="text-2xl font-bold text-blue-900 mb-1">ALMANET SCHOOL</h1>
              <p className="text-sm text-blue-900">Excellence in Education</p>
            </div>
          </div>

          {/* Admission Confirmation Title */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-blue-900">ADMISSION CONFIRMATION</h2>
          </div>

          {/* Student Photo */}
          <div className="flex justify-center">
            {buildStudentPhoto()}
          </div>

          {/* Student Information Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="w-full">
              <tbody>
                <TableRow 
                  label="Student Name" 
                  value={student.name || ''} 
                  isFirst={true}
                />
                <TableRow 
                  label="Registration/ID" 
                  value={student.registrationNumber || ''} 
                />
                <TableRow 
                  label="Class" 
                  value={`${student.className || ''} - ${student.assignedSection || ''}`} 
                />
                <TableRow 
                  label="Admission Date" 
                  value={student.admissionDate ? formatDate(student.admissionDate) : ''} 
                />
                <TableRow 
                  label="Account Status" 
                  value="Active" 
                  isStatus={true}
                />
                <TableRow 
                  label="Username" 
                  value={student.username || ''} 
                  copyEnabled={true}
                />
                <TableRow 
                  label="Password" 
                  value={student.password || ''} 
                  copyEnabled={true}
                  isPassword={true}
                  isLast={true}
                />
              </tbody>
            </table>
          </div>

          {/* Password Toggle */}
          <div className="text-center">
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {showPassword ? 'Hide Password' : 'Show Password'}
            </button>
          </div>

          {/* Print Button */}
          <div className="text-center">
            <button
              onClick={generatePDF}
              className="inline-flex items-center px-6 py-3 bg-blue-900 text-white font-medium rounded-lg hover:bg-blue-800 transition-colors duration-200 shadow-lg"
            >
              <PrinterIcon className="h-5 w-5 mr-2" />
              Print Admission Letter
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdmissionConfirmationPage;