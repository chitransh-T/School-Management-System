
// classModel.js
import pool from '../config/db.js'; // Changed from MySQL connection to PostgreSQL pool

export const createClass = async (classData) => {
  const { class_name, section, tuition_fees, teacher_name, user_email } = classData;
  const sql = `
    INSERT INTO classes (class_name, section, tuition_fees, teacher_name, user_email)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  
  try {
    const result = await pool.query(sql, [class_name, section, tuition_fees, teacher_name, user_email]);
    return result.rows[0];
  } catch (err) {
    console.error('PostgreSQL Error in createClass:', err);
    throw err;
  }
};

export const getClassesByUser = async (user_email) => {
  const query = 'SELECT * FROM classes WHERE user_email = $1';
  
  try {
    const result = await pool.query(query, [user_email]);
    return result.rows;
  } catch (err) {
    console.error('PostgreSQL Error in getClassesByUser:', err);
    throw err;
  }
};

export const updateClass = async (classId, classData) => {
  const { class_name, tuition_fees, teacher_name } = classData;
  const query = `
    UPDATE classes 
    SET class_name = $1, tuition_fees = $2, teacher_name = $3 
    WHERE id = $4
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, [class_name, tuition_fees, teacher_name, classId]);
    return result;
  } catch (err) {
    console.error('PostgreSQL Error in updateClass:', err);
    throw err;
  }
};

export const deleteClass = async (classId) => {
  const query = 'DELETE FROM classes WHERE id = $1 RETURNING *';
  
  try {
    const result = await pool.query(query, [classId]);
    return result;
  } catch (err) {
    console.error('PostgreSQL Error in deleteClass:', err);
    throw err;
  }
};