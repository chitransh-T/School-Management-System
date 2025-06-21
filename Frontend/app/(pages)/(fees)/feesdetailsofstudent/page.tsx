

'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FiCalendar, FiCheckCircle, FiDollarSign, FiEdit, FiUsers, FiInfo, FiFilter, FiMessageSquare } from 'react-icons/fi';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
import React from 'react';

interface FeeStructureModel {
  feeFieldName: string;
  amount: string;
  isCollectable: boolean;
  isMandatory: boolean;
  isMonthly: boolean;
  isOneTime: boolean;
  feeMasterId: number;
}

const FeesCollectionPage: React.FC<{ params: Promise<{ studentId: string }> }> = ({ params }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dataParam = searchParams.get('data');
  const parsedData = dataParam ? JSON.parse(decodeURIComponent(dataParam)) : {};
  const { studentName, studentClass, studentSection, isNewAdmission, preloadedData } = parsedData;

  const unwrappedParams = React.use(params);
  const studentId = unwrappedParams.studentId;

  const [token, setToken] = useState<string | null>(null);
  const [classId, setClassId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isYearlyPayment, setIsYearlyPayment] = useState<boolean>(false);
  const [isFeeDetailsExpanded, setIsFeeDetailsExpanded] = useState<boolean>(true);
  const [hasPaidMonthly, setHasPaidMonthly] = useState<boolean>(false);
  const [hasPaidYearly, setHasPaidYearly] = useState<boolean>(false);
  const [feeStructure, setFeeStructure] = useState<FeeStructureModel[]>([]);
  const [paidFeeMasterIds, setPaidFeeMasterIds] = useState<string[]>([]);
  const [paidMonths, setPaidMonths] = useState<Record<string, boolean>>({});
  const [paidOneTimeFees, setPaidOneTimeFees] = useState<Set<number>>(new Set());
  const [totalYearlyFee, setTotalYearlyFee] = useState<number>(0);
  const [totalPaid, setTotalPaid] = useState<number>(0);
  const [totalDue, setTotalDue] = useState<number>(0);
  const [feeAmounts, setFeeAmounts] = useState<Record<number, string>>({});
  const [totalDeposit, setTotalDeposit] = useState<string>('0');
  const [deposit, setDeposit] = useState<string>('0');
  const [dueBalance, setDueBalance] = useState<string>('0');
  const [remark, setRemark] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const months: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const baseUrl: string = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:1000';

  const calculateTotals = useCallback(() => {
    let total = 0;
    
    feeStructure.forEach(fee => {
      if (fee.isCollectable && !paidFeeMasterIds.includes(fee.feeMasterId.toString())) {
        const feeAmount = parseFloat(feeAmounts[fee.feeMasterId] || '0');
        if (feeAmount > 0) {
          if (fee.isMonthly && !isYearlyPayment) {
            const monthsCount = selectedMonths.length || 0;
            total += feeAmount * monthsCount;
          } else {
            total += feeAmount;
          }
        }
      }
    });

    const depositValue = parseFloat(deposit) || 0;
    const dueBalanceValue = Math.max(0, total - depositValue);
    
    setTotalDeposit(total.toFixed(2));
    setDueBalance(dueBalanceValue.toFixed(2));
    // Remove setTotalYearlyFee to keep it constant
  }, [feeAmounts, feeStructure, paidFeeMasterIds, isYearlyPayment, selectedMonths, deposit]);

  const initializeFeeAmounts = useCallback(() => {
    const newFeeAmounts: Record<number, string> = {};
    
    feeStructure.forEach(fee => {
      if (fee.isCollectable && !paidFeeMasterIds.includes(fee.feeMasterId.toString())) {
        let amount = parseFloat(fee.amount) || 0;
        if (fee.isMonthly && !isYearlyPayment) {
          amount = amount / 12;
        }
        newFeeAmounts[fee.feeMasterId] = amount.toFixed(2);
      }
    });
    
    setFeeAmounts(newFeeAmounts);
  }, [feeStructure, paidFeeMasterIds, isYearlyPayment]);

  useEffect(() => {
    if (feeStructure.length > 0) {
      initializeFeeAmounts();
    }
  }, [feeStructure, paidFeeMasterIds, isYearlyPayment, initializeFeeAmounts]);

  useEffect(() => {
    if (feeStructure.length > 0 && Object.keys(feeAmounts).length > 0) {
      calculateTotals();
    }
  }, [feeAmounts, feeStructure, paidFeeMasterIds, isYearlyPayment, selectedMonths, deposit, calculateTotals]);

  useEffect(() => {
    const loadToken = async () => {
      const storedToken = localStorage.getItem('token');
      setToken(storedToken);
    };
    loadToken();
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      if (!token) return;
      setIsLoading(true);
      try {
        if (preloadedData) {
          initializeWithPreloadedData();
        }
        await getClassId();
      } catch (err) {
        setError(`Error initializing data: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
      }
    };
    initializeData();
  }, [token]);

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !classId || !studentId) return;
      setIsLoading(true);
      try {
        await Promise.all([loadPaymentStatus(), loadYearlySummary()]);
      } catch (err) {
        setError(`Error fetching data: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [token, classId, studentId]);

  const initializeWithPreloadedData = () => {
    if (!preloadedData) {
      setError('No preloaded data provided. Loading from API...');
      return;
    }
      
    try {
      setClassId(preloadedData.classId?.toString() || studentClass);
      
      const feeStructureData: any[] = preloadedData.feeStructure || [];
      const parsedFeeStructure: FeeStructureModel[] = feeStructureData.map(item => ({
        feeFieldName: item.feeFieldName || item.fee_field_name || 'Unknown Fee',
        amount: item.amount?.toString() || '0.0',
        isCollectable: item.isCollectable || item.is_collectable || false,
        isMandatory: item.isMandatory || item.is_mandatory || false,
        isMonthly: Boolean(item.isMonthly || item.is_monthly || item.feeFieldName?.toLowerCase().includes('tution') || item.feeFieldName?.toLowerCase().includes('monthly')),
        isOneTime: Boolean(item.isOneTime || item.is_one_time),
        feeMasterId: item.feeMasterId || item.fee_master_id || 0,
      }));
      
      setFeeStructure(parsedFeeStructure);
      const newPaidFeeMasterIds = (preloadedData.paidFeeMasterIds || []).map((id: any) => id.toString());
      setPaidFeeMasterIds(newPaidFeeMasterIds);
      
      const oneTimeFees = new Set<number>();
      parsedFeeStructure.forEach(fee => {
        if (fee.isOneTime && newPaidFeeMasterIds.includes(fee.feeMasterId.toString())) {
          oneTimeFees.add(fee.feeMasterId);
        }
      });
      setPaidOneTimeFees(oneTimeFees);
      
      const yearlyFee = parsedFeeStructure.reduce((sum, fee) => {
        if (fee.isCollectable) { // Include all collectable fees, regardless of payment status
          return sum + (parseFloat(fee.amount) || 0);
        }
        return sum;
      }, 0);
      
      setTotalYearlyFee(yearlyFee);
      const totalPaidValue = parseFloat(preloadedData.total_paid) || 0;
      setTotalPaid(totalPaidValue);
      setTotalDue(Math.max(0, yearlyFee - totalPaidValue));
    } catch (err) {
      setError('Failed to parse preloaded data. Loading from API...');
    }
  };

  const getClassId = async () => {
    if (!token) return;
    
    try {
      const response = await axios.get(`${baseUrl}/api/classes`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      const classData: any[] = response.data;
      const classInfo = classData.find(
        data => (data.class_name || data.className || '').toLowerCase() === studentClass?.toLowerCase()
      );
      
      setClassId(classInfo?.id?.toString() || classInfo?.class_id?.toString() || studentClass);
    } catch (error) {
      setClassId(studentClass);
      setError(`Error fetching class ID: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const loadFeeData = async () => {
    if (!token || !classId) return;
    
    try {
      const response = await axios.get(`${baseUrl}/api/structure?classId=${classId}&studentId=${studentId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.data.success) {
        const parsedFeeStructure: FeeStructureModel[] = response.data.data.map((item: any) => ({
          feeFieldName: item.feeFieldName || item.fee_field_name || 'Unknown Fee',
          amount: item.amount?.toString() || '0.0',
          isCollectable: item.isCollectable || item.is_collectable || false,
          isMandatory: item.isMandatory || item.is_mandatory || false,
          isMonthly: Boolean(item.isMonthly || item.is_monthly || item.feeFieldName?.toLowerCase().includes('tution') || item.feeFieldName?.toLowerCase().includes('monthly')),
          isOneTime: Boolean(item.isOneTime || item.is_one_time),
          feeMasterId: item.feeMasterId || item.fee_master_id || 0,
        }));
        
        setFeeStructure(parsedFeeStructure);
        
        // Do not recalculate totalYearlyFee here to keep it constant
        const paidResponse = await axios.get(
          `${baseUrl}/api/fees/paid?studentId=${studentId}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        const newPaidFeeMasterIds = paidResponse.data.map((id: any) => id.toString());
        setPaidFeeMasterIds(newPaidFeeMasterIds);
      }
    } catch (error) {
      setError(`Failed to load fee data: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const loadPaymentStatus = async () => {
    if (!token) return;
    
    try {
      const response = await axios.get(
        `${baseUrl}/api/payment-status/${studentId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );
      
      const data = response.data.data;
      const newPaidMonths: Record<string, boolean> = {};
      let paidMonthly = false, paidYearly = false;
      Object.entries(data).forEach(([key, value]: any) => {
        newPaidMonths[key] = value.fullyPaid;
        if (value.fullyPaid) {
          if (key === 'Yearly') paidYearly = true;
          else if (months.includes(key)) paidMonthly = true;
        }
      });
      
      setPaidMonths(newPaidMonths);
      setHasPaidMonthly(paidMonthly);
      setHasPaidYearly(paidYearly);
      setIsYearlyPayment(paidYearly);
      
      if (!paidYearly && !paidMonthly) {
        const currentMonth = months[new Date().getMonth()];
        if (!newPaidMonths[currentMonth]) setSelectedMonths([currentMonth]);
      } else if (!paidYearly) {
        const unpaidMonths = months.filter(month => !newPaidMonths[month]);
        setSelectedMonths(unpaidMonths.length ? [unpaidMonths[0]] : []);
      }
    } catch (error) {
      setError(`Failed to load payment status: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const loadYearlySummary = async () => {
    if (!token) return;
    
    try {
      const response = await axios.get(`${baseUrl}/api/yearly-summary/${studentId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      const data = response.data.data;
      // Only set totalPaid and totalDue, keep totalYearlyFee constant
      setTotalPaid(data.total_paid || 0);
      setTotalDue(Math.max(0, totalYearlyFee - (data.total_paid || 0)));
    } catch (error) {
      setError(`Failed to load yearly summary: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const toggleMonthSelection = (month: string) => {
    if (paidMonths[month]) return;
    setSelectedMonths(prev => prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]);
  };

  const togglePaymentType = (yearly: boolean) => {
    if (yearly && hasPaidMonthly) {
      setError('Cannot select yearly payment as monthly fees have been paid');
      return;
    }
    if (!yearly && hasPaidYearly) {
      setError('Cannot select monthly payment as yearly fee has been paid');
      return;
    }
    setIsYearlyPayment(yearly);
    setSelectedMonths(yearly ? ['Yearly'] : [months[new Date().getMonth()]]);
    setError('');
  };

  const handleFeeAmountChange = (feeMasterId: number, value: string) => {
    if (value === '' || parseFloat(value) >= 0) {
      setFeeAmounts(prev => ({ ...prev, [feeMasterId]: value }));
    }
  };

  const handleDepositChange = (value: string) => {
    if (value === '' || parseFloat(value) >= 0) {
      setDeposit(value);
    }
  };

  const submitFees = async () => {
    if (!remark.trim()) {
      setError('Please enter a remark');
      return;
    }
    if (!isYearlyPayment && selectedMonths.length === 0) {
      setError('Please select at least one month');
      return;
    }
    const depositValue = parseFloat(deposit) || 0;
    const total = parseFloat(totalDeposit) || 0;
    if (depositValue > total) {
      setError('Deposit cannot be greater than total amount');
      return;
    }
    if (depositValue <= 0) {
      setError('Deposit amount must be greater than 0');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const feeItems = feeStructure
        .filter(fee => fee.isCollectable && !paidFeeMasterIds.includes(fee.feeMasterId.toString()) && parseFloat(feeAmounts[fee.feeMasterId] || '0') > 0)
        .map(fee => ({
          fee_master_id: fee.feeMasterId,
          fee_name: fee.feeFieldName,
          amount: parseFloat(feeAmounts[fee.feeMasterId] || fee.amount || '0'),
          is_monthly: fee.isMonthly,
          is_yearly: isYearlyPayment,
          is_one_time: fee.isOneTime,
        }));

      if (feeItems.length === 0) {
        setError('No valid fee items to submit. Check if fees are already paid or amounts are set correctly.');
        setIsLoading(false);
        return;
      }

      const response = await axios.post(
        `${baseUrl}/api/submit`,
        {
          student_id: studentId,
          student_name: studentName || 'Unknown',
          class_name: studentClass || 'N/A',
          section: studentSection || 'N/A',
          fee_months: isYearlyPayment ? ['Yearly'] : selectedMonths,
          payment_date: selectedDate.toISOString().split('T')[0],
          deposit: depositValue,
          remark: remark.trim(),
          is_new_admission: isNewAdmission || false,
          is_yearly_payment: isYearlyPayment,
          fee_items: feeItems,
        },
        { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      if (response.status === 400) {
        setError(response.data.message || 'Invalid data provided');
        setIsLoading(false);
        return;
      }
      if (response.status !== 201) {
        throw new Error(`Failed to record fee payment: ${response.status}`);
      }

      const newPaidFeeMasterIds = [
        ...paidFeeMasterIds,
        ...feeItems.map(item => item.fee_master_id.toString()),
      ];
      setPaidFeeMasterIds(newPaidFeeMasterIds);

      const newPaidMonths = { ...paidMonths };
      (isYearlyPayment ? ['Yearly'] : selectedMonths).forEach(month => {
        newPaidMonths[month] = true;
      });
      setPaidMonths(newPaidMonths);

      const newPaidOneTimeFees = new Set(paidOneTimeFees);
      feeItems.forEach(item => {
        if (item.is_one_time) {
          newPaidOneTimeFees.add(item.fee_master_id);
        }
      });
      setPaidOneTimeFees(newPaidOneTimeFees);

      const newTotalPaid = totalPaid + depositValue;
      setTotalPaid(newTotalPaid);
      setTotalDue(Math.max(0, totalYearlyFee - newTotalPaid));

      setDeposit('0');
      setRemark('');
      setSelectedMonths(isYearlyPayment ? ['Yearly'] : [months[(new Date().getMonth() + 1) % 12]]);
      setFeeAmounts({});

      setHasPaidYearly(isYearlyPayment || hasPaidYearly);
      setHasPaidMonthly(!isYearlyPayment || hasPaidMonthly);

      setSuccess('Fee payment recorded successfully');
      setTimeout(() => router.back(), 2000);

      await Promise.all([loadYearlySummary(), loadPaymentStatus()]);
    } catch (error) {
      setError(`Error submitting fees: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-blue-900 text-white shadow-md">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-xl font-bold">Fees Collection - {studentName || 'Student'}</h1>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          {error && <div className="mb-6 p-4 bg-red-800 text-white rounded-lg shadow-md">{error}</div>}
          {success && <div className="mb-6 p-4 bg-green-600 text-white rounded-lg shadow-md">{success}</div>}

          <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-xl shadow-lg mb-6 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center mb-4"><FiUsers className="mr-3" /><h2 className="text-lg font-semibold">Student: {studentName || 'Unknown'}</h2></div>
              <div className="flex items-center mb-3"><FiInfo className="mr-3" /><span>Class: {studentClass || 'N/A'}</span></div>
              <div className="flex items-center mb-3"><FiFilter className="mr-3" /><span>Section: {studentSection || 'N/A'}</span></div>
              <div className="border-t border-blue-300 my-4"></div>
              <div className="mb-4">
                <label className="block mb-2 font-medium">Payment Type:</label>
                <div className="flex border border-blue-300 rounded-lg overflow-hidden">
                  <button onClick={() => togglePaymentType(false)} disabled={hasPaidYearly} className={`flex-1 py-2 px-4 ${!isYearlyPayment ? 'bg-white text-blue-900 font-bold' : 'hover:bg-blue-800'} ${hasPaidYearly ? 'opacity-50 cursor-not-allowed' : ''}`}>Monthly</button>
                  <button onClick={() => togglePaymentType(true)} disabled={hasPaidMonthly} className={`flex-1 py-2 px-4 ${isYearlyPayment ? 'bg-white text-blue-900 font-bold' : 'hover:bg-blue-800'} ${hasPaidMonthly ? 'opacity-50 cursor-not-allowed' : ''}`}>Yearly</button>
                </div>
              </div>
              {!isYearlyPayment && !hasPaidYearly && (
                <div className="mb-4">
                  <label className="block mb-2 font-medium">Select Months:</label>
                  <div className="flex flex-wrap gap-2">
                    {months.map(month => (
                      <button
                        key={month}
                        onClick={() => toggleMonthSelection(month)}
                        disabled={paidMonths[month] || false}
                        className={`px-3 py-1 rounded-full text-sm ${selectedMonths.includes(month)
                          ? 'bg-white text-blue-900 font-medium'
                          : paidMonths[month]
                            ? 'bg-gray-600 text-gray-200 cursor-not-allowed'
                            : 'bg-blue-700 hover:bg-blue-600'}`}
                      >
                        {month} {paidMonths[month] ? '✓' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-4">
                <label className="block mb-2 font-medium">Payment Date:</label>
                <div className="relative">
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date: Date | null) => setSelectedDate(date ?? new Date())}
                    className="w-full p-3 bg-blue-800 bg-opacity-20 border border-blue-300 rounded-lg text-white"
                    customInput={<div className="flex items-center p-3 bg-blue-800 bg-opacity-20 border border-blue-300 rounded-lg cursor-pointer"><FiCalendar className="mr-2" /><span>{selectedDate.toLocaleDateString()}</span><FiEdit className="ml-auto opacity-70" /></div>}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
            <div className="p-6">
              <h2 className="text-lg font-bold text-blue-900 mb-4">Yearly Fee Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-700"><span>Total Yearly Fee:</span><span className="font-bold text-blue-900">₹{totalYearlyFee.toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-700"><span>Total Paid:</span><span className="font-bold text-green-600">₹{totalPaid.toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-700"><span>Total Due:</span><span className="font-bold text-red-600">₹{totalDue.toFixed(2)}</span></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
            <div className="flex justify-between items-center p-4 bg-blue-900 text-white cursor-pointer" onClick={() => setIsFeeDetailsExpanded(!isFeeDetailsExpanded)}>
              <h2 className="text-lg font-bold">Fee Details</h2><span className="text-xl">{isFeeDetailsExpanded ? '−' : '+'}</span>
            </div>
            {isFeeDetailsExpanded && (
              <div className="p-4">
                {feeStructure.length === 0 ? (
                  <div className="text-center py-4 text-gray-600">No fee structure available for this class</div>
                ) : (
                  <div className="space-y-4">
                    {feeStructure.map(fee => {
                      if (paidFeeMasterIds.includes(fee.feeMasterId.toString())) {
                        return (
                          <div key={fee.feeMasterId} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center"><FiCheckCircle className="text-green-600 mr-2" /><span className="text-green-700">{fee.feeFieldName} - Already Paid</span><span className="ml-auto font-bold text-green-700">₹{fee.amount}</span></div>
                          </div>
                        );
                      }
                      if (!fee.isCollectable) return null;
                      const amount = parseFloat(feeAmounts[fee.feeMasterId] || '0');
                      const totalAmount = fee.isMonthly && !isYearlyPayment ? amount * selectedMonths.length : amount;
                      return (
                        <div key={fee.feeMasterId} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center mb-2"><FiDollarSign className="text-blue-600 mr-2" /><span className="font-medium text-blue-900">{fee.feeFieldName}</span>
                            {fee.isMandatory && <span className="ml-2 px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">Required</span>}
                            {fee.isMonthly && <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">{isYearlyPayment ? 'Yearly' : 'Monthly'}</span>}
                            {fee.isOneTime && <span className="ml-2 px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">One-Time</span>}
                          </div>
                          <div className="text-sm text-gray-600 mb-3">Base: ₹{amount.toFixed(2)} {fee.isMonthly ? (isYearlyPayment ? '/year' : '/month') : ''}</div>
                          {fee.isMonthly && <div className="text-sm font-medium text-green-600 mb-3">{isYearlyPayment ? `Total (1 year): ₹${totalAmount.toFixed(2)}` : `Total (${selectedMonths.length} month${selectedMonths.length !== 1 ? 's' : ''}): ₹${totalAmount.toFixed(2)}`}</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
            <div className="p-6">
              <h2 className="text-lg font-bold text-blue-900 mb-4">Payment Summary</h2>
              <div className="space-y-4">
                <div><label className="block mb-1 text-sm font-medium text-gray-700">Total Amount</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiDollarSign className="text-gray-500" /></div><input type="text" value={totalDeposit} readOnly className="w-full pl-10 p-2 border text-gray-700 border-gray-300 rounded-lg bg-blue-50" /></div></div>
                <div><label className="block mb-1 text-sm font-medium text-gray-900">Deposit Amount*</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiDollarSign className="text-gray-500" /></div><input type="number" value={deposit} onChange={e => handleDepositChange(e.target.value)} className="w-full pl-10 p-2 border text-gray-700 border-gray-300 rounded-lg bg-blue-50" /></div></div>
                <div><label className="block mb-1 text-sm font-medium text-gray-700">Due Balance</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiInfo className="text-gray-500" /></div><input type="text" value={dueBalance} readOnly className="w-full pl-10 p-2 border text-gray-700 border-gray-300 rounded-lg bg-blue-50" /></div></div>
                <div><label className="block mb-1 text-sm font-medium text-gray-700">Remark*</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiMessageSquare className="text-gray-500" /></div><textarea value={remark} onChange={e => setRemark(e.target.value)} className="w-full pl-10 p-2 border text-gray-700 border-gray-300 rounded-lg bg-blue-50" rows={2} /></div></div>
              </div>
            </div>
          </div>

          <button
            onClick={submitFees}
            disabled={isLoading}
            className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <span className="flex items-center justify-center"><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Processing...</span> : 'Submit Fee Payment'}
          </button>
        </main>
      </div>
    </DashboardLayout>
  );
};

export default FeesCollectionPage;