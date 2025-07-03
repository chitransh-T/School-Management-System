// ✅ STEP 1: feeMasterModel.js
import pool from '../config/db.js';
export const createFeeFieldsInDB = async ({ session_id, signup_id, feeFields }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const insertPromises = feeFields.map(fee => {
      return client.query(
        `INSERT INTO fee_master (
          session_id, signup_id, fee_field_name, is_one_time, is_common_for_all_classes, amount
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          session_id,
          signup_id,
          fee.fee_name,
          fee.is_one_time || false,
          fee.is_common_for_all_classes || false,
          fee.is_common_for_all_classes ? fee.amount : null,
        ]
      );
    });

    await Promise.all(insertPromises);
    await client.query('COMMIT');

    return { success: true };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error inserting fee fields:', err);
    throw err;
  } finally {
    client.release();
  }
};

// model/feemaster.model.js

export const getFeeFieldsFromDB = async (signup_id, session_id) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT id, fee_field_name, is_one_time, is_common_for_all_classes, amount
       FROM fee_master
       WHERE signup_id = $1 AND session_id = $2`,
      [signup_id, session_id]
    );
    return result.rows;
  } catch (error) {
    console.error('DB fetch error:', error);
    throw error;
  } finally {
    client.release();
  }
};

