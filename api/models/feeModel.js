// .==================================================

import pool from '../config/db.js';

// Helper function to safely parse numbers
const parseToNumber = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};



export const createFee = async (feeData) => {
  const query = `
    INSERT INTO fee_collections (
      signup_id, student_id, class_id, session_id, section, fee_month, payment_date,
      fee_master_id, fee_name, amount, is_monthly, is_yearly, total_amount, deposit,
      is_new_admission, remark, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP)
    RETURNING *
  `;

  const values = [
    feeData.signup_id,
    feeData.student_id,
    feeData.class_id,
    feeData.session_id,
    feeData.section || null,
    feeData.fee_month || null,
    feeData.payment_date,
    feeData.fee_master_id,
    feeData.fee_name,
    parseToNumber(feeData.amount),
    feeData.is_monthly || false,
    feeData.is_yearly || false,
    parseToNumber(feeData.total_amount),
    parseToNumber(feeData.deposit),
    feeData.is_new_admission || false,
    feeData.remark || null,
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (err) {
    console.error('Error creating fee:', err);
    throw err;
  }
};

export const createMonthlyFees = async (feeData) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Validate one-time fees
    const oneTimeFeeIds = feeData.fee_items
      .filter(item => item.is_one_time)
      .map(item => item.fee_master_id);
    let paidOneTimeIds = [];
    if (oneTimeFeeIds.length > 0) {
      const oneTimeCheck = await client.query(
        `SELECT fee_master_id FROM fee_collections
         WHERE student_id = $1 AND fee_master_id = ANY($2)`,
        [feeData.student_id, oneTimeFeeIds]
      );
      paidOneTimeIds = oneTimeCheck.rows.map(row => row.fee_master_id);
    }

    // Filter out paid one-time fees from fee_items
    const validFeeItems = feeData.fee_items.filter(
      item => !item.is_one_time || !paidOneTimeIds.includes(item.fee_master_id)
    );

    if (validFeeItems.length === 0) {
      throw new Error('No valid fee items to process after filtering paid one-time fees');
    }

    const paymentStatus = await checkMonthlyFeesPaid(feeData.student_id, feeData.selected_months);
    const fullyPaidMonths = feeData.selected_months.filter(
      (month) => paymentStatus[month]?.fullyPaid
    );

    if (fullyPaidMonths.length > 0) {
      throw new Error(`Cannot charge for already paid months: ${fullyPaidMonths.join(', ')}`);
    }

    const insertLogs = [];
    let remainingDeposit = parseToNumber(feeData.deposit);

    for (const month of feeData.selected_months) {
      const status = paymentStatus[month] || {};
      for (const feeItem of validFeeItems) {
        const feeAmount = parseToNumber(feeItem.amount);
        if (feeAmount === 0) continue;

        let totalAmount = feeAmount;
        let depositForFee = 0;
        if (remainingDeposit > 0) {
          depositForFee = Math.min(remainingDeposit, totalAmount);
          remainingDeposit -= depositForFee;
        }

        const result = await createFee({
          signup_id: feeData.signup_id,
          student_id: feeData.student_id,
          class_id: feeData.class_id,
          session_id: feeData.session_id,
          section: feeData.section,
          fee_month: month,
          payment_date: feeData.payment_date,
          fee_master_id: feeItem.fee_master_id,
          fee_name: feeItem.fee_name,
          amount: feeAmount,
          is_monthly: feeItem.is_monthly,
          is_yearly: feeItem.is_yearly,
          total_amount: totalAmount,
          deposit: depositForFee,
          is_new_admission: feeData.is_new_admission,
          remark: feeData.remark,
        });

        insertLogs.push(`✅ Inserted fee for ${month} - ${feeItem.fee_name}`);
      }
    }

    await client.query('COMMIT');
    return { success: true, logs: insertLogs, remainingDeposit };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Transaction Error:', err);
    throw err;
  } finally {
    client.release();
  }
};

export const checkMonthlyFeesPaid = async (studentId, months) => {
  if (!months || months.length === 0) return {};

  const query = `
    SELECT 
      fee_month,
      CAST(amount AS DECIMAL(10,2)) as amount,
      CAST(total_amount AS DECIMAL(10,2)) as total_amount,
      CAST(deposit AS DECIMAL(10,2)) as deposit,
      CAST((total_amount - deposit) AS DECIMAL(10,2)) as remaining_amount,
      (total_amount - deposit) <= 0 as fully_paid
    FROM fee_collections 
    WHERE student_id = $1 AND fee_month = ANY($2)
    ORDER BY payment_date DESC
  `;

  try {
    const result = await pool.query(query, [studentId, months]);
    const paymentStatus = {};

    months.forEach((month) => {
      const payments = result.rows.filter((r) => r.fee_month === month);
      if (payments.length > 0) {
        const latest = payments[0];
        paymentStatus[month] = {
          fullyPaid: latest.fully_paid,
          remainingAmount: Math.max(0, parseToNumber(latest.remaining_amount)),
          amount: parseToNumber(latest.amount),
          totalAmount: parseToNumber(latest.total_amount),
          deposit: parseToNumber(latest.deposit),
        };
      } else {
        paymentStatus[month] = {
          fullyPaid: false,
          remainingAmount: 0,
          amount: 0,
          totalAmount: 0,
          deposit: 0,
        };
      }
    });

    return paymentStatus;
  } catch (err) {
    console.error('Error checking monthly fees:', err);
    throw err;
  }
};

export const getLatestDueBalance = async (studentId) => {
  const query = `
    SELECT CAST(SUM(total_amount - deposit) AS DECIMAL(10,2)) as due_balance 
    FROM fee_collections 
    WHERE student_id = $1
  `;

  try {
    const result = await pool.query(query, [studentId]);
    return parseToNumber(result.rows[0]?.due_balance);
  } catch (err) {
    console.error('Error getting due balance:', err);
    throw err;
  }
};

export const getAllPaymentStatus = async (studentId) => {
  const query = `
    SELECT 
      fee_month,
      CAST(amount AS DECIMAL(10,2)) as amount,
      CAST(deposit AS DECIMAL(10,2)) as deposit,
      CAST((total_amount - deposit) AS DECIMAL(10,2)) as remaining_amount,
      (total_amount - deposit) <= 0 as fully_paid
    FROM fee_collections 
    WHERE student_id = $1
    ORDER BY fee_month
  `;

  try {
    const result = await pool.query(query, [studentId]);
    const paymentStatus = {};

    result.rows.forEach((row) => {
      if (!paymentStatus[row.fee_month]) {
        paymentStatus[row.fee_month] = {
          fullyPaid: row.fully_paid,
          remainingAmount: Math.max(0, parseToNumber(row.remaining_amount)),
          amount: parseToNumber(row.amount),
        };
      }
    });

    return paymentStatus;
  } catch (err) {
    console.error('Error getting payment status:', err);
    throw err;
  }
};

export const findFeesByStudentId = async (studentId) => {
  const query = `
    SELECT *,
      CAST(amount AS DECIMAL(10,2)) as amount,
      CAST(total_amount AS DECIMAL(10,2)) as total_amount,
      CAST(deposit AS DECIMAL(10,2)) as deposit
    FROM fee_collections 
    WHERE student_id = $1 
    ORDER BY payment_date DESC
  `;

  try {
    const result = await pool.query(query, [studentId]);
    return result.rows.map((row) => ({
      ...row,
      amount: parseToNumber(row.amount),
      total_amount: parseToNumber(row.total_amount),
      deposit: parseToNumber(row.deposit),
    }));
  } catch (err) {
    console.error('Error finding fees:', err);
    throw err;
  }
};

export const checkFeesPaid = async (studentId, feeType) => {
  const query = `
    SELECT SUM(CAST(deposit AS DECIMAL(10,2))) as total_paid
    FROM fee_collections 
    WHERE student_id = $1 AND fee_name = $2
  `;

  try {
    const result = await pool.query(query, [studentId, feeType]);
    return parseToNumber(result.rows[0]?.total_paid) > 0;
  } catch (err) {
    console.error('Error checking fees paid:', err);
    throw err;
  }
};

export const getFeeSummaryByStudent = async (studentId) => {
  const query = `
    SELECT 
      CAST(SUM(amount) AS DECIMAL(10,2)) as total_amount,
      CAST(SUM(deposit) AS DECIMAL(10,2)) as total_deposit,
      CAST(SUM(total_amount) AS DECIMAL(10,2)) as total_charged,
      CAST(SUM(total_amount - deposit) AS DECIMAL(10,2)) as last_due_balance,
      (SELECT fee_month FROM fee_collections 
       WHERE student_id = $1 AND CAST(deposit AS DECIMAL(10,2)) > 0
       ORDER BY payment_date DESC LIMIT 1) as last_payment_month
    FROM fee_collections
    WHERE student_id = $1
  `;

  try {
    const result = await pool.query(query, [studentId]);
    const summary = result.rows[0] || {};
    return [{
      ...summary,
      total_amount: parseToNumber(summary.total_amount),
      total_deposit: parseToNumber(summary.total_deposit),
      total_charged: parseToNumber(summary.total_charged),
      last_due_balance: parseToNumber(summary.last_due_balance),
    }];
  } catch (err) {
    console.error('Error getting fee summary:', err);
    throw err;
  }
};

export const getPreviousPaymentsForMonths = async (studentId, months) => {
  if (!months || months.length === 0) return [];

  const query = `
    SELECT *,
      CAST(amount AS DECIMAL(10,2)) as amount,
      CAST(total_amount AS DECIMAL(10,2)) as total_amount,
      CAST(deposit AS DECIMAL(10,2)) as deposit
    FROM fee_collections
    WHERE student_id = $1 AND fee_month = ANY($2)
    ORDER BY payment_date DESC
  `;

  try {
    const result = await pool.query(query, [studentId, months]);
    return result.rows.map((row) => ({
      ...row,
      amount: parseToNumber(row.amount),
      total_amount: parseToNumber(row.total_amount),
      deposit: parseToNumber(row.deposit),
    }));
  } catch (err) {
    console.error('Error getting previous payments:', err);
    throw err;
  }
};

export const getYearlyFeeTotal = async (classId, sessionId, studentId) => {
  const query = `
    SELECT 
      SUM(CASE 
            WHEN fm.is_one_time THEN COALESCE(fs.amount, fm.amount, 0)
            WHEN fm.is_monthly THEN COALESCE(fs.amount, fm.amount, 0) * 12
            ELSE COALESCE(fs.amount, fm.amount, 0)
          END) as total_yearly_fee
    FROM fee_master fm
    LEFT JOIN fee_structure fs 
      ON fm.id = fs.fee_master_id AND fs.class_id = $1
    LEFT JOIN fee_collections fc
      ON fm.id = fc.fee_master_id AND fc.student_id = $3
    WHERE fm.session_id = $2
      AND (fm.is_common_for_all_classes = true OR fs.fee_master_id IS NOT NULL)
      AND (fm.is_one_time = false OR fc.fee_master_id IS NULL OR fc.deposit = 0)
  `;

  try {
    const result = await pool.query(query, [classId, sessionId, studentId]);
    return parseToNumber(result.rows[0]?.total_yearly_fee);
  } catch (err) {
    console.error('Error calculating yearly fee total:', err);
    throw err;
  }
};

export const getPaidFeeMasterIds = async (studentId) => {
  const query = `
    SELECT DISTINCT fee_master_id
    FROM fee_collections
    WHERE student_id = $1 AND deposit > 0
  `;

  try {
    const result = await pool.query(query, [studentId]);
    return result.rows.map(row => row.fee_master_id.toString());
  } catch (err) {
    console.error('Error fetching paid fee master IDs:', err);
    throw err;
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
        fm.fee_name AS fee_field_name,
        COALESCE(fs.amount, fm.amount, 0) AS amount,
        fm.is_one_time AS is_one_time,
        fm.is_monthly AS is_monthly,
        fm.is_mandatory AS is_mandatory,
        fm.is_collectable AS is_collectable
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
      isOneTime: row.is_one_time || false,
      isMonthly: row.is_monthly || false,
      isMandatory: row.is_mandatory || false,
      isCollectable: row.is_collectable || false,
    }));

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