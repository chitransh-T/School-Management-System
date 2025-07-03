
// models/attendanceModel.js - FIXED VERSION
import pool from '../config/db.js';

export const recordStudentAttendance = async (attendanceData) => {
  const { student_id, date, is_present, class_id } = attendanceData;

  const checkQuery = `
    SELECT 1 FROM attendance
    WHERE student_id = $1 AND date = $2 AND class_id = $3
  `;

  const result = await pool.query(checkQuery, [student_id, date, class_id]);

  if (result.rowCount > 0) {
    const error = new Error('Attendance already exists for this student on this date');
    error.code = 'STUDENT_ATTENDANCE_EXISTS';
    throw error;
  }

  const insertQuery = `
    INSERT INTO attendance (student_id, date, is_present, class_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;

  const insertResult = await pool.query(insertQuery, [student_id, date, is_present, class_id]);
  return insertResult.rows[0];
};

export const recordTeacherAttendance = async (attendanceData) => {
  const { teacher_id, date, is_present } = attendanceData;

  // Step 1: Check if already exists
  const checkQuery = `
    SELECT 1 FROM teacher_attendance
    WHERE teacher_id = $1 AND date = $2
  `;

  const result = await pool.query(checkQuery, [teacher_id, date]);

  if (result.rowCount > 0) {
    const error = new Error('Attendance already exists for this teacher on this date');
    error.code = 'ATTENDANCE_EXISTS';
    throw error;
  }

  // Step 2: Insert new attendance
  const insertQuery = `
    INSERT INTO teacher_attendance (teacher_id, date, is_present)
    VALUES ($1, $2, $3)
    RETURNING *
  `;

  const insertResult = await pool.query(insertQuery, [teacher_id, date, is_present]);
  return insertResult.rows[0];
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
  // Step 1: Check if any attendance record exists on that date for this school
  const attendanceExistsQuery = `
    SELECT COUNT(*) AS count
    FROM teacher_attendance ta
    JOIN teacher t ON ta.teacher_id = t.id
    WHERE ta.date = $1
      AND t.signup_id IN (
        SELECT s.id FROM signup s 
        WHERE s.school_id = (
          SELECT school_id FROM signup WHERE id = $2
        )
      )
  `;

  const attendanceExistsResult = await pool.query(attendanceExistsQuery, [date, signup_id]);
  const attendanceExists = parseInt(attendanceExistsResult.rows[0].count, 10) > 0;

  if (!attendanceExists) {
    // No attendance recorded for any teacher on this date
    return null;  // or return [];
  }

  // Step 2: Fetch attendance with join as before
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

  const results = await pool.query(query, [date, signup_id]);
  return results.rows;
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

//-----------

export async function getStudentAttendanceBySignupIdAndDate(signupId, date) {
  try {
    const query = `
      SELECT
        a.id AS attendance_id,
        s.student_name,
        c.class_name,
        c.section,
        a.date,
        a.is_present
      FROM attendance a
      JOIN students s ON s.id = a.student_id
      JOIN classes c ON c.id = a.class_id
      JOIN parent_student_link psl ON psl.student_id = s.id
      WHERE psl.parent_signup_id = $1
        AND a.date = $2
      ORDER BY a.date DESC
    `;
    const values = [signupId, date];
    const result = await pool.query(query, values);
    return result.rows;
  } catch (err) {
    console.error('Error fetching attendance by date:', err.stack);
    throw new Error('Failed to fetch attendance by date');
  }
}



export async function getStudentAttendanceBySignupIdAndMonth(signupId, date) {
  try {
    const query = `
      SELECT
        a.id AS attendance_id,
        s.student_name,
        c.class_name,
        c.section,
        a.date,
        a.is_present
      FROM attendance a
      JOIN students s ON s.id = a.student_id
      JOIN classes c ON c.id = a.class_id
      JOIN parent_student_link psl ON psl.student_id = s.id
      WHERE psl.parent_signup_id = $1
        AND DATE_TRUNC('month', a.date) = DATE_TRUNC('month', $2::date)
      ORDER BY a.date DESC
    `;
    const values = [signupId, date];
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Database error in getStudentAttendanceBySignupIdAndMonth:', error.stack);
    throw new Error(`Database error: ${error.message}`);
  }
}

