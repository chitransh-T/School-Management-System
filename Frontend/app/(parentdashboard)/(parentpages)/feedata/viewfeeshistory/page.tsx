// pages/student-fee-record.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { 
  User, 
  School, 
  Users, 
  Calendar, 
  Download, 
  CheckCircle, 
  XCircle,
  FileText,
  IndianRupee
} from 'lucide-react';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// Types
interface Student {
  student_id?: string;
  id?: string;
  _id?: string;
  student_name: string;
  assigned_class: string;
  assigned_section: string;
}

interface FeeItem {
  fee_name: string;
  amount: number;
  is_monthly: boolean;
  is_yearly: boolean;
  is_one_time: boolean;
}

interface Payment {
  payment_id: string;
  fee_months: string[];
  payment_date: string;
  deposit_amount: number;
  total_paid: number;
  total_due: number;
  remark: string;
  is_yearly_payment: boolean;
  fee_items: FeeItem[];
}

interface YearlySummary {
  totalYearlyFee: number;
  totalPaid: number;
  totalDue: number;
}

const StudentFeeRecord: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<Student[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<Record<string, Payment[]>>({});
  const [paidMonths, setPaidMonths] = useState<Record<string, Record<string, boolean>>>({});
  const [isYearlyPaid, setIsYearlyPaid] = useState<Record<string, boolean>>({});
  const [instituteName, setInstituteName] = useState<string>('ALMANET SCHOOL');
  const [logoUrlFull, setLogoUrlFull] = useState<string | null>(null);
  const [yearlySummary, setYearlySummary] = useState<Record<string, YearlySummary>>({});

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchParentData();
  }, []);

  const getAuthToken = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  const getStudentId = (student: Student): string => {
    return student.student_id?.toString() || 
           student.id?.toString() || 
           student._id?.toString() || 
           '';
  };

  const fetchParentData = async () => {
    const token = getAuthToken();
    if (!token) {
      setErrorMessage('Token missing. Please login again.');
      setIsLoading(false);
      return;
    }

    try {
      const studentResponse = await fetch(`${baseUrl}/api/dashboard/students`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (studentResponse.ok) {
        const data = await studentResponse.json();
        const students: Student[] = data.data || [];

        // Remove duplicates
        const uniqueStudentIds = new Set<string>();
        const uniqueStudents: Student[] = [];
        
        students.forEach(s => {
          const studentId = getStudentId(s);
          if (studentId && !uniqueStudentIds.has(studentId)) {
            uniqueStudentIds.add(studentId);
            uniqueStudents.push(s);
          }
        });

        setStudentData(uniqueStudents);

        // Fetch payment history and yearly summary for each student
        for (const student of uniqueStudents) {
          const studentId = getStudentId(student);
          if (studentId) {
            await fetchPaymentHistory(studentId);
          //   await fetchYearlySummary(studentId, student);
          }
        }

        await fetchProfileData();
      } else {
        setErrorMessage(`Failed to load student data: ${studentResponse.status}`);
      }
    } catch (error) {
      setErrorMessage(`Error fetching student data: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfileData = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${baseUrl}/api/profile`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const profile = await response.json();
        const innerData = profile.data;
        if (innerData) {
          setInstituteName(innerData.institute_name || 'ALMANET SCHOOL');
          const logoUrl = innerData.logo_url || '';
          if (logoUrl) {
            const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
            const cleanLogoUrl = logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`;
            setLogoUrlFull(logoUrl.startsWith('http') ? logoUrl : cleanBaseUrl + cleanLogoUrl);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchPaymentHistory = async (studentId: string) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${baseUrl}/api/history/${studentId}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const responseData = await response.json();
        const payments: any[] = responseData.data || [];

        // Group payments by payment_date
        const groupedPayments: Record<string, Payment> = {};
        
        payments.forEach(item => {
          const paymentDate = item.payment_date ? 
            new Date(item.payment_date).toLocaleDateString('en-GB') : 'N/A';
          const feeMonth = item.fee_month ? [item.fee_month.toString()] : [];
          const isYearly = item.is_yearly === true;

          const feeItem: FeeItem = {
            fee_name: item.fee_name?.toString() || 'Unknown',
            amount: typeof item.amount === 'number' ? item.amount : parseFloat(item.amount?.toString() || '0'),
            is_monthly: item.is_monthly === true,
            is_yearly: isYearly,
            is_one_time: item.is_one_time === true,
          };

          const key = `${paymentDate}-${item.remark || 'N/A'}`;
          if (!groupedPayments[key]) {
            groupedPayments[key] = {
              payment_id: item.id?.toString() || '',
              fee_months: isYearly ? ['Yearly'] : feeMonth,
              payment_date: paymentDate,
              deposit_amount: 0,
              total_paid: typeof item.total_paid === 'number' ? item.total_paid : parseFloat(item.total_paid?.toString() || '0'),
              total_due: typeof item.total_due === 'number' ? item.total_due : parseFloat(item.total_due?.toString() || '0'),
              remark: item.remark?.toString() || 'N/A',
              is_yearly_payment: isYearly,
              fee_items: [],
            };
          }
          groupedPayments[key].fee_items.push(feeItem);
          groupedPayments[key].deposit_amount += feeItem.amount;
        });

        setPaymentHistory(prev => ({
          ...prev,
          [studentId]: Object.values(groupedPayments)
        }));

        // Update paid months
        setPaidMonths(prev => {
          const newPaidMonths = { ...prev };
          newPaidMonths[studentId] = newPaidMonths[studentId] || {};
          
          Object.values(groupedPayments).forEach(payment => {
            if (payment.fee_months.includes('Yearly')) {
              setIsYearlyPaid(prev => ({ ...prev, [studentId]: true }));
              months.forEach(month => {
                newPaidMonths[studentId][month] = true;
              });
            } else {
              payment.fee_months.forEach(month => {
                newPaidMonths[studentId][month] = true;
              });
            }
          });
          
          return newPaidMonths;
        });
      }

      // Fetch payment status for consistency
      const statusResponse = await fetch(`${baseUrl}/api/payment-status/${studentId}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (statusResponse.ok) {
        const paymentStatus = await statusResponse.json();
        const statusData = paymentStatus.data || {};
        
        setPaidMonths(prev => {
          const newPaidMonths = { ...prev };
          newPaidMonths[studentId] = newPaidMonths[studentId] || {};
          
          Object.entries(statusData).forEach(([key, value]: [string, any]) => {
            let isPaid = false;
            if (typeof value === 'object' && value.fullyPaid !== undefined) {
              isPaid = value.fullyPaid === true;
            } else if (typeof value === 'boolean') {
              isPaid = value;
            }
            
            if (months.includes(key) || key === 'Yearly') {
              newPaidMonths[studentId][key] = isPaid;
            }
          });
          
          if (newPaidMonths[studentId]['Yearly']) {
            setIsYearlyPaid(prev => ({ ...prev, [studentId]: true }));
            months.forEach(month => {
              newPaidMonths[studentId][month] = true;
            });
          }
          
          return newPaidMonths;
        });
      }
    } catch (error) {
      console.error(`Error fetching payment history for student ${studentId}:`, error);
    }
  };

  // const fetchYearlySummary = async (studentId: string, student: Student) => {
  //   const token = getAuthToken();
  //   if (!token) return;

  //   try {
  //     const response = await fetch(`${baseUrl}/api/yearly-summary/${studentId}`, {
  //       headers: {
  //         'Accept': 'application/json',
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${token}`,
  //       },
  //     });

  //     if (response.ok) {
  //       const responseData = await response.json();
  //       const data = responseData.data || responseData;

  //       // Fetch fee structure
  //       const className = student.assigned_class || '';
  //       let classId = className;

  //       // Get class ID
  //       const classResponse = await fetch(`${baseUrl}/api/classes`, {
  //         headers: {
  //           'Accept': 'application/json',
  //           'Content-Type': 'application/json',
  //           'Authorization': `Bearer ${token}`,
  //         },
  //       });

  //       if (classResponse.ok) {
  //         const classData = await classResponse.json();
  //         const classes = Array.isArray(classData) ? classData : [];
          
  //         for (const cls of classes) {
  //           const classNameData = (cls.class_name || cls.className || '').toString().trim();
  //           if (classNameData.toLowerCase() === className.toLowerCase()) {
  //             classId = cls.id?.toString() || cls.class_id?.toString() || className;
  //             break;
  //           }
  //         }
  //       }

  //       // Fetch fee structure
  //       const feeResponse = await fetch(`${baseUrl}/api/structure?classId=${classId}&studentId=${studentId}`, {
  //         headers: { 'Authorization': `Bearer ${token}` },
  //       });

  //       let yearlyFee = 0;
  //       if (feeResponse.ok) {
  //         const feeData = await feeResponse.json();
  //         if (feeData.success) {
  //           const feeStructure = feeData.data || [];
  //           yearlyFee = feeStructure.reduce((sum: number, fee: any) => {
  //             const amount = typeof fee.amount === 'number' ? fee.amount : parseFloat(fee.amount?.toString() || '0');
  //             return sum + amount;
  //           }, 0);
  //         }
  //       }

  //       const totalPaid = typeof data.total_paid === 'number' ? data.total_paid : parseFloat(data.total_paid?.toString() || '0');
  //       const totalDue = Math.max(0, yearlyFee - totalPaid);

  //       setYearlySummary(prev => ({
  //         ...prev,
  //         [studentId]: {
  //           totalYearlyFee: yearlyFee,
  //           totalPaid,
  //           totalDue,
  //         }
  //       }));
  //     }
  //   } catch (error) {
  //     console.error(`Error fetching yearly summary for student ${studentId}:`, error);
  //   }
  // };
  const generatePDF = async (payment: Payment, student: Student) => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let logoImage: string | null = null;
  
      // Load logo image if available
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
  
      // Header - Logo
      if (logoImage) {
        const imageWidth = 20;
        const x = (pageWidth - imageWidth) / 2; // Center the image
        pdf.addImage(logoImage, 'PNG', x, 10, imageWidth, 20);
      } else {
        // Fallback circle with initials
        const circleX = pageWidth / 2;
        pdf.setFillColor(173, 216, 230);
        pdf.circle(circleX, 20, 10, 'F');
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 139);
        pdf.text('AS', circleX - 2, 22);
      }
  
      // School Name and Title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 139);
      pdf.text(instituteName, pageWidth / 2, 40, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Excellence in Education', pageWidth / 2, 47, { align: 'center' });
  
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('FEE RECEIPT', pageWidth / 2, 60, { align: 'center' });
  
      // Student Information Table
      autoTable(pdf, {
        startY: 70,
        head: [
          ['Student Name', student.student_name || 'N/A'],
          ['Class', student.assigned_class || 'N/A'],
          ['Section', student.assigned_section || 'N/A']
        ],
        styles: { 
          fontSize: 10, 
          cellPadding: 2, 
          textColor: [0, 0, 139] 
        },
        headStyles: { 
          fillColor: [240, 248, 255], 
          textColor: [0, 0, 139] 
        },
        columnStyles: { 
          0: { cellWidth: 50 }, 
          1: { cellWidth: 100 } 
        },
      });
  
      // Payment Details Table
      autoTable(pdf, {
        startY: (pdf as any).lastAutoTable.finalY + 10,
        head: [
          ['Payment Date', payment.payment_date || 'N/A'],
          ['Payment Type', payment.is_yearly_payment ? 'Yearly' : 'Monthly'],
          ['Fee Months', payment.fee_months.length ? payment.fee_months.join(', ') : 'N/A'],
        ],
        styles: { 
          fontSize: 10, 
          cellPadding: 2, 
          textColor: [0, 0, 139] 
        },
        headStyles: { 
          fillColor: [240, 248, 255], 
          textColor: [0, 0, 139] 
        },
        columnStyles: { 
          0: { cellWidth: 50 }, 
          1: { cellWidth: 100 } 
        },
      });
  
      // Fee Breakdown Table
      autoTable(pdf, {
        startY: (pdf as any).lastAutoTable.finalY + 10,
        head: [['Fee Name', 'Amount']],
        body: payment.fee_items.map((item) => [
          item.fee_name || 'Unknown', 
          `Rs. ${item.amount.toFixed(2)}`
        ]),
        styles: { 
          fontSize: 10, 
          cellPadding: 2, 
          textColor: [0, 0, 139] 
        },
        headStyles: { 
          fillColor: [240, 248, 255], 
          textColor: [0, 0, 139] 
        },
        columnStyles: { 
          0: { cellWidth: 100 }, 
          1: { cellWidth: 50 } 
        },
      });
  
      // Calculate totals
      const studentId = getStudentId(student);
      const summary = yearlySummary[studentId] || { totalYearlyFee: 0, totalPaid: 0, totalDue: 0 };
      const totalAmount = payment.fee_items.reduce((sum, item) => sum + item.amount, 0);
  
      // Summary Table
      autoTable(pdf, {
        startY: (pdf as any).lastAutoTable.finalY + 10,
        head: [
          ['Total Amount', `Rs. ${totalAmount.toFixed(2)}`],
          ['Total Paid (Cumulative)', `Rs. ${summary.totalPaid.toFixed(2)}`],
          ['Total Due', `Rs. ${summary.totalDue.toFixed(2)}`],
        ],
        styles: { 
          fontSize: 10, 
          cellPadding: 2, 
          textColor: [0, 0, 139] 
        },
        headStyles: { 
          fillColor: [240, 248, 255], 
          textColor: [0, 0, 139] 
        },
        columnStyles: { 
          0: { cellWidth: 100 }, 
          1: { cellWidth: 100 } 
        },
      });
  
      // Signature Fields
      const finalY = (pdf as any).lastAutoTable.finalY + 20;
      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);
      
      // Principal signature
      pdf.line(30, finalY, 80, finalY);
      pdf.text('Principal Signature', 55, finalY + 5, { align: 'center' });
      
      // School stamp
      pdf.line(130, finalY, 180, finalY);
      pdf.text('School Stamp', 155, finalY + 5, { align: 'center' });
  
      // Save the PDF
      const fileName = `fee_receipt_${student.student_name.replace(/\s+/g, '_')}_${payment.payment_date.replace(/\//g, '-')}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      setErrorMessage('Failed to generate PDF');
    }
  };
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading student data...</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 text-lg">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Students</h2>
          <p className="text-gray-600">View fee records and payment history for your children</p>
        </div>

        <div className="space-y-8">
          {studentData.map((student) => {
            const studentId = getStudentId(student);
            const summary = yearlySummary[studentId];
            const payments = paymentHistory[studentId] || [];
            const studentPaidMonths = paidMonths[studentId] || {};

            return (
              <div key={studentId} className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Student Header */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-800 px-6 py-8 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center mb-3">
                        <User className="h-6 w-6 mr-3" />
                        <h3 className="text-2xl font-bold">{student.student_name || 'N/A'}</h3>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center">
                          <School className="h-5 w-5 mr-2" />
                          <span className="text-lg">Class: {student.assigned_class || 'N/A'}</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="h-5 w-5 mr-2" />
                          <span className="text-lg">Section: {student.assigned_section || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Yearly Fee Summary */}
                  {/* {summary && (
                    <div className="mb-8">
                      <h4 className="text-xl font-semibold text-gray-900 mb-4">Yearly Fee Summary</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Total Yearly Fee</span>
                            <IndianRupee className="h-5 w-5 text-blue-600" />
                          </div>
                          <p className="text-2xl font-bold text-blue-600 mt-2">
                            {summary.totalYearlyFee > 0 ? `₹${summary.totalYearlyFee.toFixed(2)}` : 'N/A'}
                          </p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Total Paid</span>
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <p className="text-2xl font-bold text-green-600 mt-2">
                            {summary.totalPaid > 0 ? `₹${summary.totalPaid.toFixed(2)}` : 'N/A'}
                          </p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Total Due</span>
                            <XCircle className="h-5 w-5 text-red-600" />
                          </div>
                          <p className="text-2xl font-bold text-red-600 mt-2">
                            ₹{summary.totalDue.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )} */}

                  {/* Paid Months */}
                  <div className="mb-8">
                    <h4 className="text-xl font-semibold text-gray-900 mb-4">Paid Months</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {months.map((month) => {
                        const isPaid = studentPaidMonths[month] === true;
                        return (
                          <div
                            key={month}
                            className={`p-3 rounded-lg border-2 text-center transition-all ${
                              isPaid
                                ? 'bg-green-100 border-green-500 text-green-800'
                                : 'bg-gray-100 border-gray-300 text-gray-600'
                            }`}
                          >
                            <span className="text-sm font-medium">{month}</span>
                            {isPaid && <CheckCircle className="h-4 w-4 mx-auto mt-1" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment History */}
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-4">Payment History</h4>
                    {payments.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p>No payment history available</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {payments.map((payment, index) => (
                          <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center mb-3">
                                  <Calendar className="h-5 w-5 text-purple-600 mr-2" />
                                  <h5 className="font-semibold text-gray-900">
                                    Payment on {payment.payment_date}
                                  </h5>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <p className="text-sm text-gray-600">Months: {payment.fee_months.join(', ')}</p>
                                    <p className="text-sm text-gray-600">Amount: ₹{payment.deposit_amount.toFixed(2)}</p>
                                    <p className="text-sm text-gray-600">Remark: {payment.remark}</p>
                                  </div>
                                  
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 mb-2">Fee Breakdown:</p>
                                  <div className="space-y-1">
                                    {payment.fee_items.map((item, idx) => (
                                      <p key={idx} className="text-sm text-gray-600">
                                        {item.fee_name}: ₹{item.amount.toFixed(2)}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => generatePDF(payment, student)}
                                className="ml-4 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                title="Download PDF"
                              >
                                <Download className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
};

export default StudentFeeRecord;


