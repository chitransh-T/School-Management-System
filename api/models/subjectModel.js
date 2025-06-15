


import pool from '../config/db.js';

export const createSubject = async (classData) => {
  const { class_id, subject_name, marks, signup_id } = classData;
  const sql = `
    INSERT INTO subjects (class_id, subject_name, marks, signup_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  
  try {
    const result = await pool.query(sql, [
      class_id,
      subject_name,
      marks,
      signup_id
    ]);
    return result.rows[0];
  } catch (err) {
    console.error('PostgreSQL Error in createSubject:', err);
    throw err;
  }
};



export const getSubjectsByUser = async (signup_id) => {
  const query = `
    SELECT s.*, c.class_name, c.section 
    FROM subjects s
    JOIN classes c ON s.class_id = c.id
    WHERE s.signup_id = $1
  `;
  try {
    const result = await pool.query(query, [signup_id]);
    return result.rows;
  } catch (err) {
    console.error('PostgreSQL Error in getSubjectsByUser:', err);
    throw err;
  }
};




export const updateSubjectById = async (id, updatedData, signup_id) => {
  const { subject_name, marks, class_id } = updatedData;

  const query = `
    UPDATE subjects 
    SET subject_name = $1, marks = $2, class_id = $3
    WHERE id = $4 AND signup_id = $5
    RETURNING *
  `;

  try {
    const result = await pool.query(query, [
      subject_name,
      marks,
      class_id,
      id,
      signup_id,
    ]);

    if (result.rowCount === 0) {
      return null; // No match
    }

    return result.rows[0];
  } catch (err) {
    console.error('PostgreSQL Error in updateSubjectById:', err);
    throw err;
  }
};

export const deleteSubjectById = async (id, signup_id) => {
  const query = `
    DELETE FROM subjects 
    WHERE id = $1 AND signup_id = $2
    RETURNING *
  `;

  try {
    const result = await pool.query(query, [id, signup_id]);
    
    if (result.rowCount === 0) {
      return null; // Not found
    }
    
    return result.rows[0];
  } catch (err) {
    console.error('PostgreSQL Error in deleteSubjectById:', err);
    throw err;
  }
};