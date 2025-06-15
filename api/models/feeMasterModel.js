// ✅ STEP 1: feeMasterModel.js
import pool from '../config/db.js';



export const createFeeFieldsInDB = async ({ session_id, signup_id, feeFields }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const allFields = feeFields.join(', '); // 👈 Join all fields into one string

    await client.query(
      `INSERT INTO fee_master (session_id, signup_id, fee_field_name)
       VALUES ($1, $2, $3)`,
      [session_id, signup_id, allFields]
    );

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

export const getFeeFieldsFromDB = async ({ session_id, signup_id }) => {
  const query = `
    SELECT * FROM fee_master
    WHERE session_id = $1 AND signup_id = $2
    ORDER BY id ASC;
  `;
  const result = await pool.query(query, [session_id, signup_id]);
  return result.rows;
};