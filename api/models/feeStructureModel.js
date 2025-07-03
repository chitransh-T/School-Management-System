import pool from '../config/db.js';

// ✅ Insert bulk fee structure
export const createFeeStructure = async ({ class_id, signup_id, session_id, structure }) => {
  const values = structure.map(item => `(${signup_id}, ${session_id}, ${class_id}, ${item.fee_master_id}, ${item.amount}, ${item.is_collectable ?? true})`).join(',');

  const query = `
    INSERT INTO fee_structure (signup_id, session_id, class_id, fee_master_id, amount, is_collectable)
    VALUES ${values}
    RETURNING *;
  `;

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (err) {
    console.error('PostgreSQL Error in createFeeStructure:', err);
    throw err;
  }
};

// ✅ Delete old records for class
export const deleteFeeStructureForClass = async ({ class_id, signup_id, session_id }) => {
  try {
    await pool.query(
      `DELETE FROM fee_structure WHERE class_id = $1 AND signup_id = $2 AND session_id = $3`,
      [class_id, signup_id, session_id]
    );
  } catch (err) {
    console.error('PostgreSQL Error in deleteFeeStructureForClass:', err);
    throw err;
  }
};
// ✅ Get fee structure for class from DB
export const getFeeStructureByClassFromDB = async ({ signup_id, session_id, class_id }) => {
  const query = `
    SELECT fs.*, fm.fee_field_name 
    FROM fee_structure fs
    JOIN fee_master fm ON fs.fee_master_id = fm.id
    WHERE fs.signup_id = $1 AND fs.session_id = $2 AND fs.class_id = $3
  `;

  const values = [signup_id, session_id, class_id];

  try {
    const result = await pool.query(query, values);
    return result.rows;
  } catch (err) {
    console.error('PostgreSQL Error in getFeeStructureByClassFromDB:', err);
    throw err;
  }
};
