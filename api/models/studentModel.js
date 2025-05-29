

import pool from '../config/db.js';

export const createStudent = async (studentData) => {
  const {
    student_name,
    registration_number,
    date_of_birth,
    gender,
    address,
    father_name,
    mother_name,
    email,
    phone,
    assigned_class,
    assigned_section,
    birthCertificatePath,
    studentPhotoPath,
    username,
    password,
    user_email
  } = studentData;

  const sql = `
    INSERT INTO students (
      student_name,
      registration_number,
      date_of_birth,
      gender,
      address,
      father_name,
      mother_name,
      email,
      phone,
      assigned_class,
      assigned_section,
      birth_certificate,
      student_photo,
      username,
      password,
      user_email,
      role
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *
  `;

  try {
    const result = await pool.query(sql, [
      student_name,
      registration_number,
      date_of_birth,
      gender,
      address,
      father_name,
      mother_name,
      email,
      phone,
      assigned_class,
      assigned_section,
      birthCertificatePath,
      studentPhotoPath,
      username,
      password,
      user_email,
      'student'
    ]);
    return result.rows[0];
  } catch (err) {
    console.error('Error creating student:', err);
    throw err;
  }
};

export const getStudentsByUser = async (user_email) => {
  const query = 'SELECT * FROM students WHERE user_email = $1';
  try {
    const result = await pool.query(query, [user_email]);
    return result.rows;
  } catch (err) {
    console.error('Error fetching students:', err);
    throw err;
  }
};

export const getStudentById = async (studentId) => {
  const query = 'SELECT * FROM students WHERE id = $1';
  try {
    const result = await pool.query(query, [studentId]);
    return result.rows[0];
  } catch (err) {
    console.error('Error fetching student:', err);
    throw err;
  }
};

export const updateStudent = async (studentId, studentData) => {
  const {
    student_name,
    registration_number,
    date_of_birth,
    gender,
    address,
    father_name,
    mother_name,
    email,
    phone,
    assigned_class,
    assigned_section,
    birth_certificate,
    student_photo
  } = studentData;

  const updateQuery = `
    UPDATE students SET
      student_name = $1, 
      registration_number = $2, 
      date_of_birth = $3, 
      gender = $4, 
      address = $5, 
      father_name = $6, 
      mother_name = $7, 
      email = $8, 
      phone = $9, 
      assigned_class = $10, 
      assigned_section = $11, 
      birth_certificate = $12, 
      student_photo = $13
    WHERE id = $14
    RETURNING *
  `;

  try {
    const result = await pool.query(updateQuery, [
      student_name,
      registration_number,
      date_of_birth,
      gender,
      address,
      father_name,
      mother_name,
      email,
      phone,
      assigned_class,
      assigned_section,
      birth_certificate,
      student_photo,
      studentId
    ]);
    return result;
  } catch (err) {
    console.error('Error updating student:', err);
    throw err;
  }
};

export const deleteStudent = async (studentId) => {
  const deleteStudentQuery = 'DELETE FROM students WHERE id = $1 RETURNING *';
  try {
    const result = await pool.query(deleteStudentQuery, [studentId]);
    return result;
  } catch (err) {
    console.error('Error deleting student:', err);
    throw err;
  }
};

export const getStudentsByClass = async (className, user_email) => {
  const query = 'SELECT * FROM students WHERE assigned_class = $1 AND user_email = $2';
  try {
    const result = await pool.query(query, [className, user_email]);
    return result.rows;
  } catch (err) {
    console.error('Error fetching students by class:', err);
    throw err;
  }
};


export const getStudentCount = async (user_email) => {
  const query = 'SELECT COUNT(*) AS totalstudents FROM students WHERE user_email = $1';
  const values = [user_email];

  try {
    const result = await pool.query(query, values);
    return result.rows; // returns array like: [{ totalstudents: '3' }]
  } catch (err) {
    console.error('Database error in getStudentCount:', err);
    throw err;
  }
};
export const getStudentCountByClass = async (user_email) => {
  const query = `
    SELECT
      LOWER(TRIM(assigned_class)) AS class_name,
      LOWER(TRIM(assigned_section)) AS section,
      COUNT(*) AS student_count
    FROM
      students
    WHERE
      user_email = $1
      AND assigned_class IS NOT NULL
      AND assigned_class != ''
      AND assigned_section IS NOT NULL
      AND assigned_section != ''
    GROUP BY
      LOWER(TRIM(assigned_class)),
      LOWER(TRIM(assigned_section))
    ORDER BY
      LOWER(TRIM(assigned_class)),
      LOWER(TRIM(assigned_section))
  `;
  
  try {
    const result = await pool.query(query, [user_email]);
    return result.rows;
  } catch (err) {
    console.error('Error getting student count by class:', err);
    throw err;
  }
};

export const getLastRegistrationNumber = async (userEmail) => {
  const query = `
    SELECT MAX(registration_number) AS lastregnumber
    FROM students
    WHERE user_email = $1
  `;

  try {
    const result = await pool.query(query, [userEmail]);
    return result.rows[0]?.lastregnumber;
  } catch (err) {
    console.error('Error getting last registration number:', err);
    throw err;
  }
};