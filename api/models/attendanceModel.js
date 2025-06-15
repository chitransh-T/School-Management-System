// models/attendanceModel.js - FIXED VERSION
import pool from '../config/db.js';

// Record student attendance
export const recordStudentAttendance = async (attendanceData) => {
  const { student_id, date, is_present, class_id } = attendanceData;

  const query = `
    INSERT INTO attendance (student_id, date, is_present, class_id) 
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (student_id, date, class_id) DO UPDATE 
    SET is_present = EXCLUDED.is_present
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, [student_id, date, is_present, class_id]);
    return result.rows[0];
  } catch (err) {
    console.error('Error recording student attendance:', err);
    throw err;
  }
};

// Record teacher attendance
export const recordTeacherAttendance = async (attendanceData) => {
  const { teacher_id, date, is_present } = attendanceData;

  const query = `
    INSERT INTO teacher_attendance (teacher_id, date, is_present) 
    VALUES ($1, $2, $3)
    ON CONFLICT (teacher_id, date) DO UPDATE 
    SET is_present = EXCLUDED.is_present
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, [teacher_id, date, is_present]);
    return result.rows[0];
  } catch (err) {
    console.error('Error recording teacher attendance:', err);
    throw err;
  }
};



export const getStudentAttendanceByClassIdAndDate = async (classId, date, signup_id) => {
  const checkAttendanceExistsQuery = `
    SELECT COUNT(*) as count 
    FROM attendance a
    JOIN students s ON a.student_id = s.id
    WHERE a.date = $1 
      AND a.class_id = $2 
      AND s.signup_id IN (
        SELECT id FROM signup WHERE school_id = (
          SELECT school_id FROM signup WHERE id = $3
        )
      )
  `;

  try {
    const existsResult = await pool.query(checkAttendanceExistsQuery, [date, classId, signup_id]);
    const attendanceExists = parseInt(existsResult.rows[0].count, 10) > 0;

    if (!attendanceExists) {
      return null;
    }

    const query = `
      SELECT 
        s.id as student_id,
        s.student_name, 
        s.assigned_section, 
        a.is_present,
        c.class_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN classes c ON a.class_id = c.id
      WHERE a.date = $1 
        AND a.class_id = $2
        AND s.signup_id IN (
          SELECT id FROM signup WHERE school_id = (
            SELECT school_id FROM signup WHERE id = $3
          )
        )
      ORDER BY s.student_name
    `;

    const results = await pool.query(query, [date, classId, signup_id]);
    return results.rows;
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  }
};

export const getClassIdByNameAndSection = async (className, section, signup_id) => {
  const query = `
    SELECT c.id FROM classes c
    JOIN signup s1 ON c.signup_id = s1.id
    JOIN signup s2 ON s2.id = $3
    WHERE c.class_name = $1 
      AND c.section = $2
      AND s1.school_id = s2.school_id
    LIMIT 1
  `;
  try {
    const result = await pool.query(query, [className, section, signup_id]);
    return result.rows.length > 0 ? result.rows[0].id : null;
  } catch (err) {
    console.error('Error fetching class_id:', err);
    throw err;
  }
};


// Get teacher attendance
export const getTeacherAttendanceByDate = async (date, signup_id) => {
  const query = `
    SELECT 
      t.id as teacher_id,
      t.teacher_name,
      COALESCE(ta.is_present, false) as is_present
    FROM teacher t
    LEFT JOIN teacher_attendance ta 
      ON t.id = ta.teacher_id AND ta.date = $1
    WHERE t.signup_id IN (
      SELECT s.id FROM signup s 
      WHERE s.school_id = (
        SELECT school_id FROM signup WHERE id = $2
      )
    )
    ORDER BY t.teacher_name
  `;

  try {
    const results = await pool.query(query, [date, signup_id]);
    return results.rows;
  } catch (err) {
    console.error('Error fetching teacher attendance:', err);
    throw err;
  }
};


export const deleteAttendanceByStudentId = async (studentId) => {
  const deleteAttendanceQuery = 'DELETE FROM attendance WHERE student_id = $1 RETURNING *';
  try {
    const result = await pool.query(deleteAttendanceQuery, [studentId]);
    return result.rows;
  } catch (err) {
    console.error('Error deleting student attendance:', err);
    throw err;
  }
};

export const deleteAttendanceByTeacherId = async (teacherId) => {
  const deleteAttendanceQuery = 'DELETE FROM teacher_attendance WHERE teacher_id = $1 RETURNING *';
  try {
    const result = await pool.query(deleteAttendanceQuery, [teacherId]);
    return result.rows;
  } catch (err) {
    console.error('Error deleting teacher attendance:', err);
    throw err;
  }
};