"use client"
import { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
interface FeesCollectionPageProps {
  studentId: string;
  studentName: string;
  studentClass: string;
  studentSection: string;
  monthlyFee: string;
  isNewAdmission?: boolean;
}

interface FeeData {
  student_id: number;
  student_name: string;
  class_name: string;
  section: string;
  fee_month: string;
  payment_date: string;
  monthly_fee: number;
  admission_fee: number;
  registration_fee: number;
  art_material: number;
  transport: number;
  books: number;
  uniform: number;
  fine: number;
  others: number;
  previous_balance: number;
  deposit: number;
  remark: string;
  is_new_admission: boolean;
}

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

const admissionFee = 500.0;
const registrationFee = 500.0;
const uniformFee = 1000.0;

export default function FeesCollectionPage() {
  // Get parameters from URL using searchParams
  const [searchParamsLoaded, setSearchParamsLoaded] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [studentSection, setStudentSection] = useState("");
  const [monthlyFee, setMonthlyFee] = useState("0");
  const [isNewAdmission, setIsNewAdmission] = useState(false);
  
  // Load search params on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setStudentId(params.get('studentId') || "");
      setStudentName(params.get('studentName') || "");
      setStudentClass(params.get('studentClass') || "");
      setStudentSection(params.get('studentSection') || "");
      setMonthlyFee(params.get('monthlyFee') || "0");
      setIsNewAdmission(params.get('isNewAdmission') === 'true');
      setSearchParamsLoaded(true);
    }
  }, []);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'MMMM'));
  const [isLoading, setIsLoading] = useState(false);
  const [isMonthlyFeePaidForSelectedMonth, setIsMonthlyFeePaidForSelectedMonth] = useState(false);
  
  // Previous balance and payment history
  const [previousBalance, setPreviousBalance] = useState(0.0);
  const [lastPaymentMonth, setLastPaymentMonth] = useState<string | null>(null);
  
  // Fee enablers
  const [canCollectAdmissionFee, setCanCollectAdmissionFee] = useState(true);
  const [canCollectRegistrationFee, setCanCollectRegistrationFee] = useState(true);
  const [canCollectUniformFee, setCanCollectUniformFee] = useState(true);
  
  // Fee controllers
  const [monthlyFeeValue, setMonthlyFeeValue] = useState(monthlyFee);
  const [admissionFeeValue, setAdmissionFeeValue] = useState('0');
  const [registrationFeeValue, setRegistrationFeeValue] = useState('0');
  const [artMaterialValue, setArtMaterialValue] = useState('0');
  const [transportValue, setTransportValue] = useState('0');
  const [booksValue, setBooksValue] = useState('0');
  const [uniformValue, setUniformValue] = useState('0');
  const [fineValue, setFineValue] = useState('0');
  const [othersValue, setOthersValue] = useState('0');
  const [previousBalanceValue, setPreviousBalanceValue] = useState('0');
  const [totalDepositValue, setTotalDepositValue] = useState('0');
  const [depositValue, setDepositValue] = useState('0');
  const [dueBalanceValue, setDueBalanceValue] = useState('0');
  const [remarkValue, setRemarkValue] = useState('');

  const calculateTotals = useCallback(() => {
    let total = 0;

    total += parseFloat(monthlyFeeValue) || 0;
    total += parseFloat(admissionFeeValue) || 0;
    total += parseFloat(registrationFeeValue) || 0;
    total += parseFloat(artMaterialValue) || 0;
    total += parseFloat(transportValue) || 0;
    total += parseFloat(booksValue) || 0;
    total += parseFloat(uniformValue) || 0;
    total += parseFloat(fineValue) || 0;
    total += parseFloat(othersValue) || 0;
    total += parseFloat(previousBalanceValue) || 0;

    const deposit = parseFloat(depositValue) || 0;
    const dueBalance = total - deposit;

    setTotalDepositValue(total.toFixed(2));
    setDueBalanceValue(dueBalance.toFixed(2));
  }, [
    monthlyFeeValue,
    admissionFeeValue,
    registrationFeeValue,
    artMaterialValue,
    transportValue,
    booksValue,
    uniformValue,
    fineValue,
    othersValue,
    previousBalanceValue,
    depositValue
  ]);

  const showError = (message: string) => {
    alert(`Error: ${message}`);
  };

  const showInfo = (message: string) => {
    alert(`Info: ${message}`);
  };

  const showSuccess = (message: string) => {
    alert(`Success: ${message}`);
  };

  const loadFeeDetails = useCallback(async () => {
    if (!searchParamsLoaded || !studentId) {
      return;
    }

    setIsLoading(true);
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      showError('Authentication token not found');
      setIsLoading(false);
      return;
    }

    try {
      // Make real API calls to fetch student fee data
      const [eligibilityRes, summaryRes, previousPaymentsRes] = await Promise.all([
        fetch(`http://localhost:1000/api/eligibility/${studentId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:1000/api/summary/${studentId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:1000/api/previous-payments/${studentId}/${selectedMonth}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      // Check if responses are ok
      if (!eligibilityRes.ok) {
        throw new Error(`Failed to load eligibility data: ${eligibilityRes.status}`);
      }
      if (!summaryRes.ok) {
        throw new Error(`Failed to load summary data: ${summaryRes.status}`);
      }
      if (!previousPaymentsRes.ok) {
        throw new Error(`Failed to load previous payments data: ${previousPaymentsRes.status}`);
      }

      // Parse response data
      const [eligibilityData, summaryData, previousPaymentsData] = await Promise.all([
        eligibilityRes.json(),
        summaryRes.json(),
        previousPaymentsRes.json()
      ]);

      // Check if the student has already paid for this month
      const previousPayments = previousPaymentsData.data || [];
      const hasMonthlyFeePaymentForThisMonth = previousPayments.some((payment: any) => 
        payment.fee_month === selectedMonth && payment.monthly_fee > 0
      );

      // Set fee collection eligibility
      setCanCollectAdmissionFee(eligibilityData.data?.canCollectAdmissionFee ?? isNewAdmission);
      setCanCollectRegistrationFee(eligibilityData.data?.canCollectRegistrationFee ?? isNewAdmission);
      setCanCollectUniformFee(eligibilityData.data?.canCollectUniformFee ?? isNewAdmission);

      // Set fee values based on eligibility
      if (eligibilityData.data?.canCollectAdmissionFee) {
        setAdmissionFeeValue(admissionFee.toFixed(2));
      } else {
        setAdmissionFeeValue('0');
      }

      if (eligibilityData.data?.canCollectRegistrationFee) {
        setRegistrationFeeValue(registrationFee.toFixed(2));
      } else {
        setRegistrationFeeValue('0');
      }

      if (eligibilityData.data?.canCollectUniformFee) {
        setUniformValue(uniformFee.toFixed(2));
      } else {
        setUniformValue('0');
      }

      // Set previous balance
      const newPreviousBalance = (summaryData.data?.last_due_balance ?? 0).toFixed(2);
      setPreviousBalance(parseFloat(newPreviousBalance));
      setPreviousBalanceValue(newPreviousBalance);

      // Handle monthly fee payment status
      setIsMonthlyFeePaidForSelectedMonth(hasMonthlyFeePaymentForThisMonth);
      if (hasMonthlyFeePaymentForThisMonth) {
        setMonthlyFeeValue('0');
        showInfo('Monthly Fee Of This Student is Already Added for This Month! So System will Not Add it Again.');
      } else {
        setMonthlyFeeValue(monthlyFee);
      }

      // Set last payment month
      setLastPaymentMonth(summaryData.data?.last_payment_month || null);
    } catch (error: any) {
      showError(`Error loading fee details: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [searchParamsLoaded, studentId, selectedMonth, isNewAdmission, monthlyFee]);

  useEffect(() => {
    loadFeeDetails();
  }, [loadFeeDetails]);

  useEffect(() => {
    calculateTotals();
  }, [calculateTotals]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!remarkValue) {
      showError('Please enter a remark');
      return;
    }
    
    if (isMonthlyFeePaidForSelectedMonth && (parseFloat(monthlyFeeValue) || 0) > 0) {
      showError('Monthly Fee Of This Student is Already Added for This Month! System will Not Add it Again.');
      setMonthlyFeeValue('0');
      calculateTotals();
      return;
    }

    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      showError('Authentication token not found');
      return;
    }

    setIsLoading(true);

    try {
      const feeData: FeeData = {
        student_id: parseInt(studentId),
        student_name: studentName,
        class_name: studentClass,
        section: studentSection,
        fee_month: selectedMonth,
        payment_date: format(selectedDate, 'yyyy-MM-dd'),
        monthly_fee: parseFloat(monthlyFeeValue) || 0,
        admission_fee: parseFloat(admissionFeeValue) || 0,
        registration_fee: parseFloat(registrationFeeValue) || 0,
        art_material: parseFloat(artMaterialValue) || 0,
        transport: parseFloat(transportValue) || 0,
        books: parseFloat(booksValue) || 0,
        uniform: parseFloat(uniformValue) || 0,
        fine: parseFloat(fineValue) || 0,
        others: parseFloat(othersValue) || 0,
        previous_balance: parseFloat(previousBalanceValue) || 0,
        deposit: parseFloat(depositValue) || 0,
        remark: remarkValue,
        is_new_admission: isNewAdmission,
      };

      // Make real API call to submit fee payment
      const response = await fetch('http://localhost:1000/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(feeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      const responseData = await response.json();
      showSuccess(responseData.message || 'Fee payment recorded successfully');
      
      // Navigate back to the collectfees page after successful submission
      window.history.back();
    } catch (error: any) {
      showError(error.message || 'Error submitting fee payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = parseISO(e.target.value);
    setSelectedDate(date);
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="bg-blue-900 text-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">
            Fees Collection - {studentName}
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Info Card */}
            <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 text-white">
                <div className="flex items-center mb-4">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <h2 className="text-lg font-bold">Student: {studentName}</h2>
                </div>
                
                <div className="flex items-center mb-4">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <p>Class: {studentClass}</p>
                </div>
                
                <div className="flex items-center mb-6">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p>Section: {studentSection}</p>
                </div>
                
                <div className="border-t border-white border-opacity-50 my-4"></div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white bg-opacity-20 rounded-lg p-3">
                    <label className="block text-sm font-medium mb-1">Fee Month*</label>
                    <select
                      className="w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                      {months.map((month) => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="bg-white bg-opacity-20 rounded-lg p-3">
                    <label className="block text-sm font-medium mb-1">Payment Date</label>
                    <input
                      type="date"
                      className="w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={format(selectedDate, 'yyyy-MM-dd')}
                      onChange={handleDateChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Fee Details */}
            <div>
              <h2 className="text-xl font-bold text-blue-900 mb-4">Fee Details</h2>
              
              <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
                {/* Monthly Fee */}
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-1">Monthly Fee*</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <input
                      type="number"
                      className={`block w-full pl-10 pr-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-blue-800 ${isMonthlyFeePaidForSelectedMonth ? 'bg-gray-100' : 'bg-white'}`}
                      value={monthlyFeeValue}
                      onChange={(e) => setMonthlyFeeValue(e.target.value)}
                      disabled={isMonthlyFeePaidForSelectedMonth}
                      required
                    />
                  </div>
                </div>
                
                {/* One-time fees row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">Admission Fee</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <input
                        type="number"
                        className={`block w-full pl-10 pr-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-blue-800 ${canCollectAdmissionFee ? 'bg-white' : 'bg-gray-100'}`}
                        value={admissionFeeValue}
                        onChange={(e) => setAdmissionFeeValue(e.target.value)}
                        disabled={!canCollectAdmissionFee}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">Registration Fee</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <input
                        type="number"
                        className={`block w-full pl-10 pr-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-blue-800 ${canCollectRegistrationFee ? 'bg-white' : 'bg-gray-100'}`}
                        value={registrationFeeValue}
                        onChange={(e) => setRegistrationFeeValue(e.target.value)}
                        disabled={!canCollectRegistrationFee}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Additional fees row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">Art Material</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                      </div>
                      <input
                        type="number"
                        className="block w-full pl-10 pr-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-blue-800 bg-white"
                        value={artMaterialValue}
                        onChange={(e) => setArtMaterialValue(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">Transport</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                      <input
                        type="number"
                        className="block w-full pl-10 pr-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-blue-800 bg-white"
                        value={transportValue}
                        onChange={(e) => setTransportValue(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Additional fees row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">Books</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <input
                        type="number"
                        className="block w-full pl-10 pr-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-blue-800 bg-white"
                        value={booksValue}
                        onChange={(e) => setBooksValue(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">Uniform</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        type="number"
                        className={`block w-full pl-10 pr-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-blue-800 ${canCollectUniformFee ? 'bg-white' : 'bg-gray-100'}`}
                        value={uniformValue}
                        onChange={(e) => setUniformValue(e.target.value)}
                        disabled={!canCollectUniformFee}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Additional fees row 3 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">Fine</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <input
                        type="number"
                        className="block w-full pl-10 pr-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-blue-800 bg-white"
                        value={fineValue}
                        onChange={(e) => setFineValue(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">Others</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                        </svg>
                      </div>
                      <input
                        type="number"
                        className="block w-full pl-10 pr-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-blue-800 bg-white"
                        value={othersValue}
                        onChange={(e) => setOthersValue(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
{/* Payment Summary */}
<div className="mt-8">
  <h2 className="text-xl font-bold text-blue-900 mb-4">Payment Summary</h2>
  
  <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
    {/* Previous Balance */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Previous Balance
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            className="h-5 w-5 text-gray-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
        <input
          type="number"
          readOnly
          className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-100 font-medium text-gray-700"
          value={previousBalanceValue}
        />
      </div>
    </div>

    {/* Total Amount */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Total Amount
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            className="h-5 w-5 text-gray-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" 
            />
          </svg>
        </div>
        <input
          type="number"
          readOnly
          className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-100 font-medium text-gray-700"
          value={totalDepositValue}
        />
      </div>
    </div>

    {/* Deposit Amount */}
    <div>
      <label className="block text-sm font-medium text-blue-800 mb-1">
        Deposit Amount *
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            className="h-5 w-5 text-blue-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" 
            />
          </svg>
        </div>
        <input
          type="number"
          required
          className="w-full pl-10 pr-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
          value={depositValue}
          onChange={(e) => setDepositValue(e.target.value)}
          min="0"
          step="0.01"
        />
      </div>
    </div>

    {/* Due Balance */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Due Balance
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            className="h-5 w-5 text-gray-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
        <input
          type="number"
          readOnly
          className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-100 font-medium text-gray-700"
          value={dueBalanceValue}
        />
      </div>
    </div>

    {/* Remark */}
    <div>
      <label className="block text-sm font-medium text-blue-800 mb-1">
        Remark *
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            className="h-5 w-5 text-blue-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
            />
          </svg>
        </div>
        <input
          type="text"
          required
          className="w-full pl-10 pr-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
          placeholder="Enter payment remarks"
          value={remarkValue}
          onChange={(e) => setRemarkValue(e.target.value)}
        />
      </div>
    </div>
  </div>
</div>

            {/* Submit Button */}
            <div className="flex justify-end mt-6">
              <button
                type="submit"
                className="bg-blue-900 hover:bg-blue-800 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition duration-200 flex items-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>Submit Payment</>
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </DashboardLayout>
  );
}
