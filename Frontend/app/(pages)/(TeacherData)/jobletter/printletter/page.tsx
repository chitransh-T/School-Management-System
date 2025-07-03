

'use client';

import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
import React, { useState, useEffect } from 'react';
import { BriefcaseIcon, UserIcon, PrinterIcon, ClipboardDocumentIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Teacher {
  id: string;
  name: string;
  dateOfBirth: string;
  dateOfJoining: string;
  gender: string;
  qualification: string;
  experience: string;
  salary: string;
  address: string;
  phone: string;
  teacherPhoto: string;
  qualificationCertificate: string;
  username: string;
  password: string;
}

const JobLetterPrintPage: React.FC = () => {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [instituteName, setInstituteName] = useState<string>('ALMANET SCHOOL');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const storedTeacherData = localStorage.getItem('selectedTeacher');

        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        if (!storedTeacherData) {
          setError('No teacher data found. Please select a teacher from the job letter page.');
          setLoading(false);
          return;
        }

        const parsedTeacher: Teacher = JSON.parse(storedTeacherData);
        parsedTeacher.dateOfJoining = new Date(parsedTeacher.dateOfJoining).toISOString();
        setTeacher(parsedTeacher);

        const profileResponse = await fetch(`${baseUrl}/api/profile`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!profileResponse.ok) {
          throw new Error(`Failed to fetch profile: ${profileResponse.status}`);
        }

        const profile = await profileResponse.json();
        const innerData = profile.data;

        if (innerData) {
          setInstituteName(innerData.institute_name || 'ALMANET SCHOOL');
          const logoPath = innerData.logo_url || '';
          if (logoPath) {
            const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
            const cleanLogoUrl = logoPath.startsWith('/') ? logoPath : `/${logoPath}`;
            setLogoUrl(logoPath.startsWith('http') ? logoPath : `${cleanBaseUrl}${cleanLogoUrl}`);
          }
        } else {
          throw new Error('No profile data received');
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setInstituteName('ALMANET SCHOOL');
        setLogoUrl(null);
        setError(`Error loading data: ${err}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [baseUrl]);

  const formatDate = (date: string): string => {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(date));
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 1000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const buildTeacherPhoto = () => {
    if (!teacher || !teacher.teacherPhoto) {
      return (
        <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-200">
          <UserIcon className="h-12 w-12 text-blue-900" />
        </div>
      );
    }

    const fullPhotoPath = teacher.teacherPhoto.startsWith('http')
      ? teacher.teacherPhoto
      : `${baseUrl}/Uploads/${teacher.teacherPhoto}`;

    return (
      <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-blue-200">
        <img
          src={fullPhotoPath}
          alt="Teacher"
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            if (target.parentElement) {
              target.parentElement.innerHTML = `
                <div class="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-200">
                  <svg class="h-12 w-12 text-blue-900" fill="none" viewBox="00 24 24" stroke="currentColor">
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
      <tr className={`${isFirst ? 'rounded-t-lg' : ''} ${isLast ? 'rounded-b-lg' : ''}`}>
        <td
          className={`px-4 py-3 font-bold text-blue-900 bg-blue-50 border-b border-blue-100 ${
            isFirst ? 'rounded-tl-lg' : ''
          } ${isLast ? 'rounded-bl-lg' : ''}`}
        >
          {label}
        </td>
        <td
          className={`px-4 py-3 text-blue-800 border-b border-blue-100 ${isFirst ? 'rounded-tr-lg' : ''} ${
            isLast ? 'rounded-br-lg' : ''
          }`}
        >
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
                {isCopied && <span className="absolute ml-2 text-xs text-green-600 font-medium">Copied!</span>}
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const generatePDF = async () => {
    if (!teacher) return;

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();

      // Define colors
      const blue900 = [13, 71, 161];
      const blue800 = [30, 136, 229];
      const blue100 = [240, 248, 255];
      const blue200 = [144, 202, 249];
      const green100 = [220, 252, 231];
      const green800 = [22, 101, 52];

      // Header
      pdf.setFillColor(blue100[0], blue100[1], blue100[2]);
      pdf.roundedRect(10, 10, pageWidth - 20, 40, 5, 5, 'F');

      if (logoUrl) {
        try {
          const imgResponse = await fetch(logoUrl);
          const imgBlob = await imgResponse.blob();
          const imgUrl = URL.createObjectURL(imgBlob);
          pdf.addImage(imgUrl, 'PNG', pageWidth / 2 - 15, 15, 30, 30, undefined, 'FAST');
          URL.revokeObjectURL(imgUrl);
        } catch (err) {
          console.error('Error loading logo for PDF:', err);
          pdf.setFillColor(blue200[0], blue200[1], blue200[2]);
          pdf.circle(pageWidth / 2, 30, 15, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(12);
          pdf.text('AS', pageWidth / 2, 32, { align: 'center' });
        }
      } else {
        pdf.setFillColor(blue200[0], blue200[1], blue200[2]);
        pdf.circle(pageWidth / 2, 30, 15, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.text('AS', pageWidth / 2, 32, { align: 'center' });
      }

      pdf.setFontSize(24);
      pdf.setTextColor(blue900[0], blue900[1], blue900[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.text(instituteName, pageWidth / 2, 55, { align: 'center' });
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Excellence in Education', pageWidth / 2, 65, { align: 'center' });

      pdf.setFontSize(22);
      pdf.setTextColor(blue900[0], blue900[1], blue900[2]);
      pdf.text('APPOINTMENT LETTER', pageWidth / 2, 85, { align: 'center' });

      pdf.setDrawColor(blue200[0], blue200[1], blue200[2]);
      pdf.setLineWidth(1);
      pdf.circle(pageWidth / 2, 110, 30);
      if (teacher.teacherPhoto) {
        try {
          const photoUrl = teacher.teacherPhoto.startsWith('http')
            ? teacher.teacherPhoto
            : `${baseUrl}/Uploads/${teacher.teacherPhoto}`;
          const imgResponse = await fetch(photoUrl);
          const imgBlob = await imgResponse.blob();
          const imgUrl = URL.createObjectURL(imgBlob);
          pdf.addImage(imgUrl, 'PNG', pageWidth / 2 - 30, 80, 60, 60, undefined, 'FAST');
          URL.revokeObjectURL(imgUrl);
        } catch (err) {
          console.error('Error loading teacher photo for PDF:', err);
          pdf.setFontSize(12);
          pdf.setTextColor(0, 0, 0);
          pdf.text('PHOTO', pageWidth / 2, 110, { align: 'center' });
        }
      } else {
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text('PHOTO', pageWidth / 2, 110, { align: 'center' });
      }

      autoTable(pdf, {
        startY: 150,
        head: [['Field', 'Value']],
        body: [
          ['Teacher Name', teacher.name || ''],
          ['Qualification', teacher.qualification || ''],
          ['Experience', teacher.experience || ''],
          ['Salary', teacher.salary || ''],
          ['Joining Date', teacher.dateOfJoining ? formatDate(teacher.dateOfJoining) : ''],
          ['Account Status', 'Active'],
          ['Username', teacher.username || ''],
          ['Password', '••••••••'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [blue100[0], blue100[1], blue100[2]], textColor: [blue900[0], blue900[1], blue900[2]], fontStyle: 'bold' },
        bodyStyles: { textColor: [blue800[0], blue800[1], blue800[2]] },
        alternateRowStyles: { fillColor: [245, 250, 255] },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 100 },
        },
        styles: {
          cellPadding: 3,
          fontSize: 10,
          overflow: 'linebreak',
        },
        didParseCell: (data) => {
          if (data.row.index === 6 && data.column.index === 1) {
            data.cell.styles.fillColor = [green100[0], green100[1], green100[2]];
            data.cell.styles.textColor = [green800[0], green800[1], green800[2]];
            data.cell.styles.halign = 'center';
          }
        },
      });

      const yPosition = (pdf as any).lastAutoTable.finalY + 40;
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Authorized Signature', pageWidth / 2, yPosition, { align: 'center' });

      pdf.setFillColor(blue100[0], blue100[1], blue100[2]);
      pdf.roundedRect(10, yPosition + 20, pageWidth - 20, 30, 5, 5, 'F');
      pdf.setFontSize(12);
      pdf.setTextColor(blue900[0], blue900[1], blue900[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Important Note:', pageWidth / 2, yPosition + 30, { align: 'center' });
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(blue800[0], blue800[1], blue800[2]);
      pdf.text(
        'Please keep this appointment letter for your records...',
        pageWidth / 2,
        yPosition + 40,
        { align: 'center' }
      );

      pdf.save(`appointment_letter_${teacher.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-500 text-center mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-center text-gray-800 mb-4">Error Loading Data</h2>
          <p className="text-gray-600 text-center">{error || 'No teacher data available'}</p>
          <div className="mt-6 text-center">
            <a
              href="/jobletter"
              className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Return to Teacher List
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-4">
        <div className="space-y-8">
          {/* School Header */}
          <div className="bg-blue-50 rounded-xl shadow-md overflow-hidden text-center p-6">
            <div className="flex justify-center mb-4">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="School Logo"
                  className="w-20 h-20 rounded-full object-cover"
                  onError={() => setLogoUrl(null)}
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center">
                  <BriefcaseIcon className="h-12 w-12 text-white" />
                </div>
              )}
            </div>
            <h1 className="text-2xl font-bold text-blue-900">{instituteName}</h1>
            <p className="text-sm text-blue-900">Excellence in Education</p>
          </div>

          {/* Appointment Letter Title */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-blue-900">APPOINTMENT LETTER</h2>
          </div>

          {/* Teacher Photo */}
          <div className="flex justify-center mb-4">
            {buildTeacherPhoto()}
          </div>

          {/* Teacher Information Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="w-full">
              <tbody>
                <TableRow label="Teacher Name" value={teacher.name || ''} isFirst={true} />
                <TableRow label="Qualification" value={teacher.qualification || ''} />
                <TableRow label="Experience" value={teacher.experience || ''} />
                <TableRow label="Salary" value={teacher.salary || ''} />
                <TableRow
                  label="Joining Date"
                  value={teacher.dateOfJoining ? formatDate(teacher.dateOfJoining) : ''}
                />
                <TableRow label="Account Status" value="Active" isStatus={true} />
                <TableRow label="Username" value={teacher.username || ''} copyEnabled={true} />
                <TableRow
                  label="Password"
                  value={teacher.password || ''}
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
              Print Appointment Letter
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default JobLetterPrintPage;