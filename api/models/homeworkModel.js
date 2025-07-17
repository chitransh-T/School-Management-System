import pool from '../config/db.js';

// Create new homework entry


import db from '../config/db.js'; // or your db connection setup

export const createHomework = async ({
  class_id,
  homework,
  start_date,
  end_date,
  signup_id,
  session_id,
  pdf_file_path = null, // ✅ support optional PDF
}) => {
  const query = `
    INSERT INTO homework (
      class_id,
      homework,
      start_date,
      end_date,
      signup_id,
      session_id,
      pdf_file_path
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;

  const values = [
    class_id,
    homework,
    start_date,
    end_date,
    signup_id,
    session_id,
    pdf_file_path,
  ];

  const result = await db.query(query, values);
  return result.rows[0];
};


// Fetch all homework assigned by a teacher (signup_id) where end_date >= today
export const getHomeworkByTeacher = async (signup_id) => {
  const sql = `
    SELECT *
    FROM homework
    WHERE signup_id = $1
      AND end_date >= CURRENT_DATE
    ORDER BY start_date DESC, created_at DESC
  `;

  try {
    const result = await pool.query(sql, [signup_id]);
    return result.rows;
  } catch (err) {
    console.error('PostgreSQL Error in getHomeworkByTeacher:', err);
    throw err;
  }
};

// Delete a homework entry only if it belongs to the user (teacher)
export const deleteHomework = async (id, signup_id) => {
  const sql = `
    DELETE FROM homework 
    WHERE id = $1 AND signup_id = $2
  `;

  try {
    const result = await pool.query(sql, [id, signup_id]);
    return { rowCount: result.rowCount };  // rowCount = number of deleted rows
  } catch (err) {
    console.error('PostgreSQL Error in deleteHomework:', err);
    throw err;
  }
};



// ✅ Do not export this directly if you already have exported getHomework
// export const getHomeworkForParent = async (parentSignupId) => {
//   const query = `
//     SELECT
//       h.homework,
//       h.class_id,
//       h.start_date,
//       h.end_date,
//       s.id AS student_id,
//       s.student_name,
//       subj.subject_name,
//       t.teacher_name,
//       h.pdf_file_path
//     FROM parent_student_link psl
//     JOIN students s ON s.id = psl.student_id
//     JOIN classes c ON 
//       LOWER(TRIM(s.assigned_class)) = LOWER(TRIM(c.class_name))
//       AND LOWER(TRIM(s.assigned_section)) = LOWER(TRIM(c.section))
//     JOIN teacher_assignments ta ON ta.class_id = c.id
//     JOIN teacher t ON t.id = ta.teacher_id
//     JOIN subjects subj ON subj.id = ta.subject_id
//     JOIN signup sp ON sp.id = t.signup_id
//     JOIN homework h ON 
//       LOWER(TRIM(h.class_id)) = LOWER(TRIM(c.class_name))
//       AND CAST(h.signup_id AS INTEGER) = sp.id
//     WHERE psl.parent_signup_id = $1
//     ORDER BY h.start_date DESC
//   `;
//   const result = await pool.query(query, [parentSignupId]);
//   return result.rows;
// };

export const getHomeworkForParent = async (parentSignupId) => {
  const query = `
    SELECT
      h.homework,
      h.class_id,
      h.start_date,
      h.end_date,
      s.id AS student_id,
      s.student_name,
      subj.subject_name,
      t.teacher_name,
      h.pdf_file_path
    FROM parent_student_link psl
    JOIN students s ON s.id = psl.student_id
    JOIN signup stu_signup ON stu_signup.id = s.signup_id
    JOIN classes c ON 
      LOWER(TRIM(s.assigned_class)) = LOWER(TRIM(c.class_name))
      AND LOWER(TRIM(s.assigned_section)) = LOWER(TRIM(c.section))
    JOIN teacher_assignments ta ON ta.class_id = c.id
    JOIN teacher t ON t.id = ta.teacher_id
    JOIN signup teacher_signup ON teacher_signup.id = t.signup_id
    JOIN subjects subj ON subj.id = ta.subject_id
    JOIN homework h ON 
      LOWER(TRIM(h.class_id)) = LOWER(TRIM(c.class_name))
      AND CAST(h.signup_id AS INTEGER) = teacher_signup.id
    WHERE 
      psl.parent_signup_id = $1
      AND teacher_signup.school_id = stu_signup.school_id  -- ✅ Ensures same school
    ORDER BY h.start_date DESC
  `;
  
  const result = await pool.query(query, [parentSignupId]);
  return result.rows;
};