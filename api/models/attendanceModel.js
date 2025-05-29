
// models/attendanceModel.js
import pool from '../config/db.js';

export const recordStudentAttendance = async (attendanceData) => {
  const { student_id, date, is_present, class_name } = attendanceData;
  
  const query = `
    INSERT INTO attendance (student_id, date, is_present, class_name) 
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, [student_id, date, is_present, class_name]);
    return result.rows[0];
  } catch (err) {
    console.error('Error recording student attendance:', err);
    throw err;
  }
};

export const recordTeacherAttendance = async (attendanceData) => {
  const { teacher_id, date, is_present } = attendanceData;
  console.log('Teacher Attendance Data:', attendanceData);
  
  const query = `
    INSERT INTO teacher_attendance (teacher_id, date, is_present) 
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, [teacher_id, date, is_present]);
    return result.rows[0];
  } catch (err) {
    console.error('Error recording teacher attendance:', err);
    throw err;
  }
};

export const getStudentAttendanceByClassAndSectionAndDate = async (className, section, date, user_email) => {
  const checkAttendanceExistsQuery = `
    SELECT COUNT(*) as count 
    FROM attendance 
    WHERE date = $1 
      AND class_name = $2 
      AND student_id IN (
        SELECT id FROM students 
        WHERE assigned_class = $3 
          AND assigned_section = $4 
          AND user_email = $5
      )
  `;

  try {
    const existsResult = await pool.query(checkAttendanceExistsQuery, [date, className, className, section, user_email]);
    const attendanceExists = existsResult.rows[0].count > 0;

    if (!attendanceExists) {
      return null; // No attendance exists
    }

    const query = `
      SELECT 
        students.id as student_id,
        students.student_name, 
        students.assigned_section, 
        COALESCE(attendance.is_present, false) as is_present
      FROM students 
      LEFT JOIN attendance ON attendance.student_id = students.id 
        AND attendance.date = $1 
        AND attendance.class_name = $2
      WHERE students.assigned_class = $3
        AND students.assigned_section = $4
        AND students.user_email = $5
      ORDER BY students.student_name
    `;

    const results = await pool.query(query, [date, className, className, section, user_email]);
    return results.rows;
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  }
};

// export const getTeacherAttendanceByDate = async (date, user_email) => {
//   const query = `
//     SELECT teacher.teacher_name, teacher_attendance.is_present 
//     FROM teacher_attendance 
//     JOIN teacher ON teacher_attendance.teacher_id = teacher.id
//     WHERE teacher_attendance.date = $1
//       AND teacher.user_email = $2
//   `;
  
//   try {
//     const results = await pool.query(query, [date, user_email]);
//     return results.rows;
//   } catch (err) {
//     console.error('Error fetching teacher attendance:', err);
//     throw err;
//   }
// };

export const getTeacherAttendanceByDate = async (date, user_email) => {
  const query = `
    SELECT 
      teacher.teacher_name, 
      CASE 
        WHEN teacher_attendance.is_present = true THEN 1 
        ELSE 0 
      END AS is_present
    FROM teacher_attendance 
    JOIN teacher ON teacher_attendance.teacher_id = teacher.id
    WHERE teacher_attendance.date = $1
      AND teacher.user_email = $2
  `;
  
  try {
    const results = await pool.query(query, [date, user_email]);
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
    return result.rows[0];
  } catch (err) {
    console.error('Error deleting student attendance:', err);
    throw err;
  }
};

export const deleteAttendanceByTeacherId = async (teacherId) => {
  const deleteAttendanceQuery = 'DELETE FROM teacher_attendance WHERE teacher_id = $1 RETURNING *';
  try {
    const result = await pool.query(deleteAttendanceQuery, [teacherId]);
    return result.rows[0];
  } catch (err) {
    console.error('Error deleting teacher attendance:', err);
    throw err;
  }
};