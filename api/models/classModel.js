


import pool from '../config/db.js';

// Create a new class
export const createClass = async (classData) => {
  const { class_name, section, tuition_fees, teacher_id, signup_id } = classData;
  const sql = `
    INSERT INTO classes (class_name, section, tuition_fees, teacher_id, signup_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  
  try {
    const result = await pool.query(sql, [class_name, section, tuition_fees, teacher_id, signup_id]);
    return result.rows[0];
  } catch (err) {
    console.error('PostgreSQL Error in createClass:', err);
    throw err;
  }
};


export const getClassesBySchoolId = async (signup_id) => {
  const query = `
    SELECT c.*
    FROM classes c
    JOIN signup s ON c.signup_id = s.id
    WHERE s.school_id = (
      SELECT school_id FROM signup WHERE id = $1
    )
  `;
  try {
    const result = await pool.query(query, [signup_id]);
    return result.rows;
  } catch (err) {
    console.error('PostgreSQL Error in getClassesBySchoolId:', err);
    throw err;
  }
};


// Update class details
export const updateClass = async (classId, classData) => {
  const { class_name, tuition_fees, teacher_id } = classData;
  const query = `
    UPDATE classes 
    SET class_name = $1, tuition_fees = $2, teacher_id = $3
    WHERE id = $4
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, [class_name, tuition_fees, teacher_id, classId]);
    return result;
  } catch (err) {
    console.error('PostgreSQL Error in updateClass:', err);
    throw err;
  }
};

// Delete a class
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