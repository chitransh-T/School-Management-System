


import {
  createFee,
  createMonthlyFees,
  findFeesByStudentId,
  checkFeesPaid,
  getFeeSummaryByStudent,
  getLatestDueBalance,
  checkMonthlyFeesPaid,
  getPreviousPaymentsForMonths,
  getAllPaymentStatus
} from '../models/feeModel.js';

export const submitFeePayment = async (req, res) => {
  try {
    const feeData = req.body;

    // Validate required fields
    if (!feeData.student_id || !feeData.student_name || !feeData.class_name || !feeData.payment_date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Handle multiple months submission
    if (feeData.selected_months?.length > 0) {
      try {
        // Check payment status for selected months
        const paymentStatus = await checkMonthlyFeesPaid(feeData.student_id, feeData.selected_months);
        
        // Get the latest due balance
        const latestDue = await getLatestDueBalance(feeData.student_id);

        // Prepare monthly fees data
        const monthlyFees = {};
        feeData.selected_months.forEach(month => {
          const status = paymentStatus[month] || {};
          monthlyFees[month] = status.fullyPaid ? 0 : 
                            (status.remainingAmount > 0 ? status.remainingAmount : 
                            (feeData.monthly_fees[month] || parseFloat(feeData.monthly_fee) || 0));
        });

        // Create the fees
        const result = await createMonthlyFees({
          ...feeData,
          monthly_fees: monthlyFees,
          previous_balance: latestDue,
          deposit: parseFloat(feeData.deposit) || 0
        });

        res.status(201).json({
          success: true,
          message: 'Fee payments recorded successfully',
          data: {
            monthsProcessed: feeData.selected_months.length,
            remainingDeposit: result.remainingDeposit || 0
          }
        });
      } catch (err) {
        console.error('Error submitting fee payments:', err);
        res.status(500).json({
          success: false,
          message: 'Failed to record fee payments',
          error: err.message
        });
      }
    } else {
      // Handle single month submission
      try {
        const latestDue = await getLatestDueBalance(feeData.student_id);
        
        const totalAmount = (parseFloat(feeData.monthly_fee) || 0) +
                          (parseFloat(feeData.admission_fee) || 0) +
                          (parseFloat(feeData.registration_fee) || 0) +
                          (parseFloat(feeData.art_material) || 0) +
                          (parseFloat(feeData.transport) || 0) +
                          (parseFloat(feeData.books) || 0) +
                          (parseFloat(feeData.uniform) || 0) +
                          (parseFloat(feeData.fine) || 0) +
                          (parseFloat(feeData.others) || 0) +
                          latestDue;

        const result = await createFee({
          ...feeData,
          previous_balance: latestDue,
          total_amount: totalAmount,
          due_balance: totalAmount - (parseFloat(feeData.deposit) || 0),
          deposit: parseFloat(feeData.deposit) || 0
        });

        res.status(201).json({
          success: true,
          message: 'Fee payment recorded successfully',
          data: result
        });
      } catch (err) {
        console.error('Error submitting fee payment:', err);
        res.status(500).json({
          success: false,
          message: 'Failed to record fee payment',
          error: err.message
        });
      }
    }
  } catch (err) {
    console.error('Error in submitFeePayment:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to process fee payment',
      error: err.message
    });
  }
};

export const getStudentFeeHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    const results = await findFeesByStudentId(studentId);
    res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.error('Error fetching fee history:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fee history',
      error: err.message
    });
  }
};

export const checkFeeEligibility = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const [hasPaidAdmission, hasPaidRegistration, hasPaidUniform] = await Promise.all([
      checkFeesPaid(studentId, 'admission_fee'),
      checkFeesPaid(studentId, 'registration_fee'),
      checkFeesPaid(studentId, 'uniform')
    ]);

    res.status(200).json({
      success: true,
      data: {
        canCollectAdmissionFee: !hasPaidAdmission,
        canCollectRegistrationFee: !hasPaidRegistration,
        canCollectUniformFee: !hasPaidUniform
      }
    });
  } catch (err) {
    console.error('Error checking fee eligibility:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to check fee eligibility',
      error: err.message
    });
  }
};

export const getFeeSummary = async (req, res) => {
  try {
    const { studentId } = req.params;
    const results = await getFeeSummaryByStudent(studentId);
    res.status(200).json({ success: true, data: results[0] || {} });
  } catch (err) {
    console.error('Error fetching fee summary:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fee summary',
      error: err.message
    });
  }
};

export const getPreviousPaymentsForCurrentMonth = async (req, res) => {
  try {
    const { studentId, month } = req.params;
    const results = await getPreviousPaymentsForMonths(studentId, [month]);
    res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.error('Error fetching previous payments:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch previous payments',
      error: err.message
    });
  }
};

export const getAllPaymentStatusController = async (req, res) => {
  try {
    const { studentId } = req.params;
    const results = await getAllPaymentStatus(studentId);
    res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.error('Error fetching all payment status:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment status',
      error: err.message
    });
  }
};
