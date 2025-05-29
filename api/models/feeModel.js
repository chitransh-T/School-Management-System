

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
      student_id, student_name, class_name, fee_month, payment_date,
      monthly_fee, admission_fee, registration_fee, art_material,
      transport, books, uniform, fine, others,
      previous_balance, total_amount, due_balance, deposit,
      is_new_admission, remark
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
    RETURNING *
  `;

  const values = [
    feeData.student_id,
    feeData.student_name,
    feeData.class_name,
    feeData.fee_month || null,
    feeData.payment_date,
    parseToNumber(feeData.monthly_fee),
    parseToNumber(feeData.admission_fee),
    parseToNumber(feeData.registration_fee),
    parseToNumber(feeData.art_material),
    parseToNumber(feeData.transport),
    parseToNumber(feeData.books),
    parseToNumber(feeData.uniform),
    parseToNumber(feeData.fine),
    parseToNumber(feeData.others),
    parseToNumber(feeData.previous_balance),
    parseToNumber(feeData.total_amount),
    parseToNumber(feeData.due_balance),
    parseToNumber(feeData.deposit),
    feeData.is_new_admission || false,
    feeData.remark || null
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
    
    const paymentStatus = await checkMonthlyFeesPaid(feeData.student_id, feeData.selected_months);
    const fullyPaidMonths = feeData.selected_months.filter(
      month => paymentStatus[month]?.fullyPaid
    );

    if (fullyPaidMonths.length > 0) {
      throw new Error(`Cannot charge for already fully paid months: ${fullyPaidMonths.join(', ')}`);
    }

    const insertLogs = [];
    let remainingDeposit = parseToNumber(feeData.deposit);
    let previousBalance = parseToNumber(feeData.previous_balance);
    let isFirstMonth = true;

    for (const month of feeData.selected_months) {
      const status = paymentStatus[month] || {};
      const monthlyFee = status.remainingAmount > 0 ? 
                       status.remainingAmount : 
                       (parseToNumber(feeData.monthly_fees?.[month]) || parseToNumber(feeData.monthly_fee));

      if (monthlyFee <= 0) {
        insertLogs.push(`ℹ️ Skipped ${month} (already paid)`);
        continue;
      }

      const admissionFee = isFirstMonth ? parseToNumber(feeData.admission_fee) : 0;
      const registrationFee = isFirstMonth ? parseToNumber(feeData.registration_fee) : 0;
      const artMaterial = isFirstMonth ? parseToNumber(feeData.art_material) : 0;
      const transport = isFirstMonth ? parseToNumber(feeData.transport) : 0;
      const books = isFirstMonth ? parseToNumber(feeData.books) : 0;
      const uniform = isFirstMonth ? parseToNumber(feeData.uniform) : 0;
      const fine = isFirstMonth ? parseToNumber(feeData.fine) : 0;
      const others = isFirstMonth ? parseToNumber(feeData.others) : 0;

      let totalAmount = monthlyFee + admissionFee + registrationFee + 
                      artMaterial + transport + books + 
                      uniform + fine + others;

      if (isFirstMonth && previousBalance > 0 && !status.remainingAmount) {
        totalAmount += previousBalance;
      }

      let deposit = 0;
      if (remainingDeposit > 0) {
        deposit = Math.min(remainingDeposit, totalAmount);
        remainingDeposit -= deposit;
      }

      const dueBalance = totalAmount - deposit;

      const query = `
        INSERT INTO fee_collections (
          student_id, student_name, class_name, fee_month, payment_date,
          monthly_fee, admission_fee, registration_fee, art_material,
          transport, books, uniform, fine, others,
          previous_balance, total_amount, due_balance, deposit,
          is_new_admission, remark
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        RETURNING *
      `;

      const values = [
        feeData.student_id,
        feeData.student_name,
        feeData.class_name,
        month,
        feeData.payment_date,
        monthlyFee,
        admissionFee,
        registrationFee,
        artMaterial,
        transport,
        books,
        uniform,
        fine,
        others,
        isFirstMonth && previousBalance > 0 && !status.remainingAmount ? previousBalance : 0,
        totalAmount,
        dueBalance,
        deposit,
        feeData.is_new_admission || false,
        feeData.remark || null
      ];

      await client.query(query, values);
      insertLogs.push(`✅ Inserted fee for ${month}`);
      isFirstMonth = false;
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
      CAST(monthly_fee AS DECIMAL(10,2)) as monthly_fee,
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

    months.forEach(month => {
      const payments = result.rows.filter(r => r.fee_month === month);
      if (payments.length > 0) {
        const latest = payments[0];
        paymentStatus[month] = {
          fullyPaid: latest.fully_paid,
          remainingAmount: Math.max(0, parseToNumber(latest.remaining_amount)),
          monthlyFee: parseToNumber(latest.monthly_fee),
          totalAmount: parseToNumber(latest.total_amount),
          deposit: parseToNumber(latest.deposit)
        };
      } else {
        paymentStatus[month] = {
          fullyPaid: false,
          remainingAmount: 0,
          monthlyFee: 0,
          totalAmount: 0,
          deposit: 0
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
    SELECT CAST(due_balance AS DECIMAL(10,2)) as due_balance 
    FROM fee_collections 
    WHERE student_id = $1 
    ORDER BY payment_date DESC, id DESC
    LIMIT 1
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
      CAST(monthly_fee AS DECIMAL(10,2)) as monthly_fee,
      CAST(deposit AS DECIMAL(10,2)) as deposit,
      CAST((monthly_fee - deposit) AS DECIMAL(10,2)) as remaining_amount,
      (monthly_fee - deposit) <= 0 as fully_paid
    FROM fee_collections 
    WHERE student_id = $1
    ORDER BY fee_month
  `;

  try {
    const result = await pool.query(query, [studentId]);
    const paymentStatus = {};
    
    result.rows.forEach(row => {
      paymentStatus[row.fee_month] = {
        fullyPaid: row.fully_paid,
        remainingAmount: Math.max(0, parseToNumber(row.remaining_amount)),
        monthlyFee: parseToNumber(row.monthly_fee)
      };
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
      CAST(monthly_fee AS DECIMAL(10,2)) as monthly_fee,
      CAST(admission_fee AS DECIMAL(10,2)) as admission_fee,
      CAST(registration_fee AS DECIMAL(10,2)) as registration_fee,
      CAST(art_material AS DECIMAL(10,2)) as art_material,
      CAST(transport AS DECIMAL(10,2)) as transport,
      CAST(books AS DECIMAL(10,2)) as books,
      CAST(uniform AS DECIMAL(10,2)) as uniform,
      CAST(fine AS DECIMAL(10,2)) as fine,
      CAST(others AS DECIMAL(10,2)) as others,
      CAST(previous_balance AS DECIMAL(10,2)) as previous_balance,
      CAST(total_amount AS DECIMAL(10,2)) as total_amount,
      CAST(due_balance AS DECIMAL(10,2)) as due_balance,
      CAST(deposit AS DECIMAL(10,2)) as deposit
    FROM fee_collections 
    WHERE student_id = $1 
    ORDER BY payment_date DESC
  `;

  try {
    const result = await pool.query(query, [studentId]);
    // Convert all numeric fields to numbers
    return result.rows.map(row => ({
      ...row,
      monthly_fee: parseToNumber(row.monthly_fee),
      admission_fee: parseToNumber(row.admission_fee),
      registration_fee: parseToNumber(row.registration_fee),
      art_material: parseToNumber(row.art_material),
      transport: parseToNumber(row.transport),
      books: parseToNumber(row.books),
      uniform: parseToNumber(row.uniform),
      fine: parseToNumber(row.fine),
      others: parseToNumber(row.others),
      previous_balance: parseToNumber(row.previous_balance),
      total_amount: parseToNumber(row.total_amount),
      due_balance: parseToNumber(row.due_balance),
      deposit: parseToNumber(row.deposit)
    }));
  } catch (err) {
    console.error('Error finding fees:', err);
    throw err;
  }
};

export const checkFeesPaid = async (studentId, feeType) => {
  const query = `
    SELECT SUM(CAST(${feeType} AS DECIMAL(10,2))) as total_paid
    FROM fee_collections 
    WHERE student_id = $1
  `;

  try {
    const result = await pool.query(query, [studentId]);
    return parseToNumber(result.rows[0]?.total_paid) > 0;
  } catch (err) {
    console.error('Error checking fees paid:', err);
    throw err;
  }
};

export const getFeeSummaryByStudent = async (studentId) => {
  const query = `
    SELECT 
      CAST(SUM(monthly_fee) AS DECIMAL(10,2)) as total_monthly_fee,
      CAST(SUM(admission_fee) AS DECIMAL(10,2)) as total_admission_fee,
      CAST(SUM(registration_fee) AS DECIMAL(10,2)) as total_registration_fee,
      CAST(SUM(art_material) AS DECIMAL(10,2)) as total_art_material,
      CAST(SUM(transport) AS DECIMAL(10,2)) as total_transport,
      CAST(SUM(books) AS DECIMAL(10,2)) as total_books,
      CAST(SUM(uniform) AS DECIMAL(10,2)) as total_uniform,
      CAST(SUM(fine) AS DECIMAL(10,2)) as total_fine,
      CAST(SUM(others) AS DECIMAL(10,2)) as total_others,
      CAST(SUM(deposit) AS DECIMAL(10,2)) as total_deposit,
      CAST(SUM(total_amount) AS DECIMAL(10,2)) as total_charged,
      (SELECT CAST(due_balance AS DECIMAL(10,2)) FROM fee_collections 
       WHERE student_id = $1 
       ORDER BY payment_date DESC, id DESC LIMIT 1) as last_due_balance,
      (SELECT fee_month FROM fee_collections 
       WHERE student_id = $1 AND CAST(monthly_fee AS DECIMAL(10,2)) > 0
       ORDER BY payment_date DESC LIMIT 1) as last_payment_month
    FROM fee_collections
    WHERE student_id = $1
  `;

  try {
    const result = await pool.query(query, [studentId]);
    // Convert numeric fields to numbers
    const summary = result.rows[0] || {};
    return [{
      ...summary,
      total_monthly_fee: parseToNumber(summary.total_monthly_fee),
      total_admission_fee: parseToNumber(summary.total_admission_fee),
      total_registration_fee: parseToNumber(summary.total_registration_fee),
      total_art_material: parseToNumber(summary.total_art_material),
      total_transport: parseToNumber(summary.total_transport),
      total_books: parseToNumber(summary.total_books),
      total_uniform: parseToNumber(summary.total_uniform),
      total_fine: parseToNumber(summary.total_fine),
      total_others: parseToNumber(summary.total_others),
      total_deposit: parseToNumber(summary.total_deposit),
      total_charged: parseToNumber(summary.total_charged),
      last_due_balance: parseToNumber(summary.last_due_balance)
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
      CAST(monthly_fee AS DECIMAL(10,2)) as monthly_fee,
      CAST(admission_fee AS DECIMAL(10,2)) as admission_fee,
      CAST(registration_fee AS DECIMAL(10,2)) as registration_fee,
      CAST(art_material AS DECIMAL(10,2)) as art_material,
      CAST(transport AS DECIMAL(10,2)) as transport,
      CAST(books AS DECIMAL(10,2)) as books,
      CAST(uniform AS DECIMAL(10,2)) as uniform,
      CAST(fine AS DECIMAL(10,2)) as fine,
      CAST(others AS DECIMAL(10,2)) as others,
      CAST(previous_balance AS DECIMAL(10,2)) as previous_balance,
      CAST(total_amount AS DECIMAL(10,2)) as total_amount,
      CAST(due_balance AS DECIMAL(10,2)) as due_balance,
      CAST(deposit AS DECIMAL(10,2)) as deposit
    FROM fee_collections
    WHERE student_id = $1 AND fee_month = ANY($2)
    ORDER BY payment_date DESC
  `;

  try {
    const result = await pool.query(query, [studentId, months]);
    // Convert all numeric fields to numbers
    return result.rows.map(row => ({
      ...row,
      monthly_fee: parseToNumber(row.monthly_fee),
      admission_fee: parseToNumber(row.admission_fee),
      registration_fee: parseToNumber(row.registration_fee),
      art_material: parseToNumber(row.art_material),
      transport: parseToNumber(row.transport),
      books: parseToNumber(row.books),
      uniform: parseToNumber(row.uniform),
      fine: parseToNumber(row.fine),
      others: parseToNumber(row.others),
      previous_balance: parseToNumber(row.previous_balance),
      total_amount: parseToNumber(row.total_amount),
      due_balance: parseToNumber(row.due_balance),
      deposit: parseToNumber(row.deposit)
    }));
  } catch (err) {
    console.error('Error getting previous payments:', err);
    throw err;
  }
};