

import pool from '../config/db.js';

export const createSubject = async (classData) => {
  const { class_name, section, subject_name, marks, user_email } = classData;
  const sql = `
    INSERT INTO subjects (class_name, section, subject_name, marks, user_email)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  
  try {
    const result = await pool.query(sql, [
      class_name,
      section,
      subject_name,
      marks,
      user_email
    ]);
    return result.rows[0];
  } catch (err) {
    console.error('PostgreSQL Error in createSubject:', err);
    throw err;
  }
};

export const getSubjectsByUser = async (user_email) => {
  const query = 'SELECT * FROM subjects WHERE user_email = $1';
  
  try {
    const result = await pool.query(query, [user_email]);
    return result.rows;
  } catch (err) {
    console.error('PostgreSQL Error in getSubjectsByUser:', err);
    throw err;
  }
};

export const updateSubjectById = async (id, updatedData, userEmail) => {
  const { subject_name, marks } = updatedData;
  const query = `
    UPDATE subjects 
    SET subject_name = $1, marks = $2
    WHERE id = $3 AND user_email = $4
    RETURNING *
  `;

  try {
    const result = await pool.query(query, [
      subject_name,
      marks,
      id,
      userEmail
    ]);
    
    if (result.rowCount === 0) {
      return null; // No subject found
    }
    
    return result.rows[0];
  } catch (err) {
    console.error('PostgreSQL Error in updateSubjectById:', err);
    throw err;
  }
};

export const deleteSubjectById = async (id, userEmail) => {
  const query = `
    DELETE FROM subjects 
    WHERE id = $1 AND user_email = $2
    RETURNING *
  `;

  try {
    const result = await pool.query(query, [id, userEmail]);
    
    if (result.rowCount === 0) {
      return null; // Not found
    }
    
    return result.rows[0];
  } catch (err) {
    console.error('PostgreSQL Error in deleteSubjectById:', err);
    throw err;
  }
};