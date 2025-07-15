import pool from '../config/db.js';
import {
  createFee,
  createMonthlyFees,
  findFeesByStudentId,
  checkFeesPaid,
  getFeeSummaryByStudent,
  getLatestDueBalance,
  checkMonthlyFeesPaid,
  getPreviousPaymentsForMonths,
  getAllPaymentStatus,
  getYearlyFeeTotal,
  getPaidFeeMasterIds,
} from '../models/feeModel.js';
import { getActiveSessionFromDB } from '../models/sessionModel.js';

export const submitFeePayment = async (req, res) => {
  try {
    const feeData = req.body;
    const signup_id = req.signup_id;

    console.log(`submitFeePayment: signup_id=${signup_id}, feeData=${JSON.stringify(feeData)}`);

    // Validate required fields
    if (!feeData.student_id || !feeData.class_name || !feeData.payment_date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: student_id, class_name, payment_date',
      });
    }

    // Fetch active session
    if (!signup_id) {
      console.error('No signup_id provided in request');
      return res.status(401).json({
        success: false,
        message: 'Authentication error: missing signup_id',
      });
    }
    const session = await getActiveSessionFromDB(signup_id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No active session found',
      });
    }

    // Resolve class_name to class_id
    const classQuery = `
      SELECT id FROM classes WHERE class_name = $1 LIMIT 1
    `;
    const classResult = await pool.query(classQuery, [feeData.class_name]);
    if (!classResult.rows[0]) {
      return res.status(400).json({
        success: false,
        message: `Class not found: ${feeData.class_name}`,
      });
    }
    const class_id = classResult.rows[0].id;

    // Fetch fee_master details to check is_one_time
    const feeItemIds = feeData.fee_items.map(item => item.fee_master_id);
    const feeMasterQuery = `
      SELECT id, is_one_time, fee_field_name AS fee_name FROM fee_master WHERE id = ANY($1)
    `;
    const feeMasterResult = await pool.query(feeMasterQuery, [feeItemIds]);
    if (feeMasterResult.rows.length === 0) {
      console.error(`No fee_master records found for IDs: ${feeItemIds}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid fee_master IDs provided',
      });
    }

    const feeMasterMap = feeMasterResult.rows.reduce((map, row) => {
      map[row.id] = { is_one_time: row.is_one_time, fee_name: row.fee_name };
      return map;
    }, {});
    feeData.fee_items.forEach(item => {
      if (feeMasterMap[item.fee_master_id]) {
        item.is_one_time = feeMasterMap[item.fee_master_id].is_one_time;
        item.fee_name = item.fee_name || feeMasterMap[item.fee_master_id].fee_name;
      } else {
        console.warn(`Fee master ID ${item.fee_master_id} not found in fee_master table`);
        item.is_one_time = false;
      }
    });

    // Validate fee items
    if (!feeData.fee_items.every(item => typeof item.is_one_time === 'boolean')) {
      console.error('Invalid is_one_time values in fee_items:', feeData.fee_items);
      return res.status(400).json({
        success: false,
        message: 'Invalid fee item configuration',
      });
    }

    // Handle multiple months submission
    const selected_months = feeData.fee_months || [];
    if (selected_months.length > 0) {
      const feeItems = feeData.fee_items || [];
      if (feeItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fee items provided',
        });
      }

      const result = await createMonthlyFees({
        signup_id,
        student_id: feeData.student_id,
        class_id,
        session_id: session.id,
        section: feeData.section || null,
        selected_months,
        payment_date: feeData.payment_date,
        fee_items: feeItems,
        deposit: parseFloat(feeData.deposit) || 0,
        is_new_admission: feeData.is_new_admission || false,
        remark: feeData.remark || null,
        is_yearly_payment: feeData.is_yearly_payment || false,
      });

      res.status(201).json({
        success: true,
        message: 'Fee payments recorded successfully',
        data: {
          monthsProcessed: selected_months.length,
          remainingDeposit: result.remainingDeposit || 0,
          logs: result.logs,
        },
      });
    } else {
      // Handle single fee submission
      const totalDeposit = parseFloat(feeData.deposit || 0);
      const feeItems = feeData.fee_items || [];
      if (feeItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fee items provided',
        });
      }

      const results = await Promise.all(
        feeItems.map(async (item, index) => {
          const totalAmount = parseFloat(item.amount || 0);
          // Distribute deposit equally across all items
          const deposit = totalDeposit / feeItems.length;
          return await createFee({
            signup_id,
            student_id: feeData.student_id,
            class_id,
            session_id: session.id,
            section: feeData.section || null,
            fee_month: feeData.fee_months ? feeData.fee_months[0] : null,
            payment_date: feeData.payment_date,
            fee_master_id: item.fee_master_id,
            fee_name: item.fee_name,
            amount: totalAmount,
            is_monthly: item.is_monthly || false,
            is_yearly: item.is_yearly || false,
            total_amount: totalAmount,
            deposit,
            is_new_admission: feeData.is_new_admission || false,
            remark: feeData.remark || null,
          });
        })
      );

      res.status(201).json({
        success: true,
        message: 'Fee payment recorded successfully',
        data: results,
      });
    }
  } catch (err) {
    console.error('Error in submitFeePayment:', {
      error: err.message,
      stack: err.stack,
      feeData: JSON.stringify(feeData),
      query: feeMasterQuery,
      params: [feeItemIds],
    });
    res.status(400).json({
      success: false,
      message: err.message || 'Failed to process fee payment',
      error: err.message,
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
      error: err.message,
    });
  }
};

export const checkFeeEligibility = async (req, res) => {
  try {
    const { studentId } = req.params;

    const [hasPaidAdmission, hasPaidRegistration, hasPaidUniform] =
      await Promise.all([
        checkFeesPaid(studentId, 'Admission Fee'),
        checkFeesPaid(studentId, 'Registration Fee'),
        checkFeesPaid(studentId, 'Uniform Fee'),
      ]);

    res.status(200).json({
      success: true,
      data: {
        canCollectAdmissionFee: !hasPaidAdmission,
        canCollectRegistrationFee: !hasPaidRegistration,
        canCollectUniformFee: !hasPaidUniform,
      },
    });
  } catch (err) {
    console.error('Error checking fee eligibility:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to check fee eligibility',
      error: err.message,
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
      error: err.message,
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
      error: err.message,
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
      error: err.message,
    });
  }
};

export const getYearlyFeeSummary = async (req, res) => {
  const { studentId } = req.params;
  try {
    const summaryResult = await pool.query(
      `
      SELECT 
        COALESCE(SUM(total_amount), 0) AS total_yearly_fee,
        COALESCE(SUM(deposit), 0) AS total_paid,
        COALESCE(SUM(total_amount - deposit), 0) AS total_due
      FROM fee_collections
      WHERE student_id = $1
      `,
      [studentId]
    );

    const summary = summaryResult.rows[0] || {
      total_yearly_fee: 0,
      total_paid: 0,
      total_due: 0,
    };

    const studentResult = await pool.query(
      `
      SELECT assigned_class, assigned_section
      FROM students
      WHERE id = $1
      `,
      [studentId]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    const { assigned_class } = studentResult.rows[0];

    const classResult = await pool.query(
      `
      SELECT id
      FROM classes
      WHERE class_name = $1
      `,
      [assigned_class]
    );

    if (classResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    const classId = classResult.rows[0].id;

    const feeStructureResult = await pool.query(
      `
      SELECT 
        SUM(COALESCE(fs.amount, fm.amount, 0)) AS total_yearly_fee
      FROM fee_master fm
      LEFT JOIN fee_structure fs 
        ON fm.id = fs.fee_master_id AND fs.class_id = $1
      LEFT JOIN fee_collections fc
        ON fm.id = fc.fee_master_id AND fc.student_id = $2
      WHERE (fm.is_common_for_all_classes = true OR fs.fee_master_id IS NOT NULL)
        AND (fm.is_one_time = false OR fc.fee_master_id IS NULL OR fc.deposit = 0)
      `,
      [classId, studentId]
    );

    summary.total_yearly_fee = parseFloat(feeStructureResult.rows[0]?.total_yearly_fee || summary.total_yearly_fee);

    res.status(200).json({
      success: true,
      data: {
        total_yearly_fee: parseFloat(summary.total_yearly_fee),
        total_paid: parseFloat(summary.total_paid),
        total_due: parseFloat(summary.total_due),
      },
    });
  } catch (err) {
    console.error('Error fetching yearly fee summary:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching yearly fee summary',
      error: err.message,
    });
  }
};

export const getPaidFees = async (req, res) => {
  try {
    const { studentId, months } = req.query;
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameter: studentId',
      });
    }

    // Fetch one-time fees that are paid
    const oneTimePaidQuery = `
      SELECT DISTINCT fc.fee_master_id
      FROM fee_collections fc
      JOIN fee_master fm ON fc.fee_master_id = fm.id
      WHERE fc.student_id = $1 AND fm.is_one_time = true AND fc.deposit > 0
    `;
    const oneTimePaidResult = await pool.query(oneTimePaidQuery, [studentId]);
    const oneTimePaidIds = oneTimePaidResult.rows.map(row => row.fee_master_id.toString());

    // Fetch monthly fees paid for specific months (if provided)
    let monthlyPaidIds = [];
    if (months) {
      const monthsArray = months.split(',');
      const monthlyPaidQuery = `
        SELECT DISTINCT fc.fee_master_id
        FROM fee_collections fc
        JOIN fee_master fm ON fc.fee_master_id = fm.id
        WHERE fc.student_id = $1 AND fm.is_monthly = true 
          AND fc.fee_month = ANY($2) AND (fc.total_amount - fc.deposit) <= 0
      `;
      const monthlyPaidResult = await pool.query(monthlyPaidQuery, [studentId, monthsArray]);
      monthlyPaidIds = monthlyPaidResult.rows.map(row => row.fee_master_id.toString());
    }

    const paidFeeMasterIds = [...new Set([...oneTimePaidIds, ...monthlyPaidIds])];
    console.log(`getPaidFees: studentId=${studentId}, months=${months}, paidFeeMasterIds=${paidFeeMasterIds}`);

    res.status(200).json(paidFeeMasterIds);
  } catch (err) {
    console.error('Error fetching paid fees:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch paid fees',
      error: err.message,
    });
  }
};

export const getFeeStructure = async (req, res) => {
  try {
    const { classId, studentId } = req.query;
    if (!classId || !studentId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: classId, studentId',
      });
    }

    const query = `
      SELECT 
        fm.id AS fee_master_id,
        fm.fee_field_name AS fee_field_name,
        COALESCE(fs.amount, fm.amount, 0) AS amount,
        fm.is_one_time AS is_one_time,
        fs.is_collectable AS is_collectable,
        fs.installments_allowed AS is_mandatory,
        CASE WHEN fs.frequency = 'monthly' THEN true ELSE false END AS is_monthly
      FROM fee_master fm
      LEFT JOIN fee_structure fs
        ON fm.id = fs.fee_master_id AND fs.class_id = $1
      LEFT JOIN fee_collections fc
        ON fm.id = fc.fee_master_id AND fc.student_id = $2
      WHERE (fm.is_common_for_all_classes = true OR fs.fee_master_id IS NOT NULL)
        AND (fm.is_one_time = false OR fc.fee_master_id IS NULL OR fc.deposit = 0)
    `;
    const result = await pool.query(query, [classId, studentId]);

    const feeStructure = result.rows.map(row => ({
      feeMasterId: row.fee_master_id,
      feeFieldName: row.fee_field_name,
      amount: parseFloat(row.amount).toFixed(2),
      isOneTime: row.is_one_time,
      isMonthly: row.is_monthly || false,
      isMandatory: row.is_mandatory || false,
      isCollectable: row.is_collectable || false,
    }));

    console.log(`getFeeStructure: Returning feeStructure for classId=${classId}, studentId=${studentId}:`, feeStructure);

    res.status(200).json({ success: true, data: feeStructure });
  } catch (err) {
    console.error('Error fetching fee structure:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fee structure',
      error: err.message,
    });
  }
};




