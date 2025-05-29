


import pool from '../config/db.js';

export const createTeacher = async (teacherData) => {
  const {
    teacher_name,
    email,
    date_of_birth,
    date_of_joining,
    gender,
    guardian_name,
    qualification,
    experience,
    salary,
    address,
    phone,
    qualification_certificate, 
    teacher_photo,
    user_email
  } = teacherData;

  const sql = `
    INSERT INTO teacher (
      teacher_name,
      email,
      date_of_birth,
      date_of_joining,
      gender,
      guardian_name,
      qualification,
      experience,
      salary,
      address,
      phone,
      qualification_certificate,
      teacher_photo,
      user_email
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *
  `;

  try {
    const result = await pool.query(sql, [
      teacher_name,
      email,
      date_of_birth,
      date_of_joining,
      gender,
      guardian_name,
      qualification,
      experience,
      salary,
      address,
      phone,
      qualification_certificate,
      teacher_photo,
      user_email
    ]);
    return result.rows[0];
  } catch (err) {
    console.error('Error creating teacher:', err);
    throw err;
  }
};

export const getTeachersByUser = async (user_email) => {
  const query = 'SELECT * FROM teacher WHERE user_email = $1';
  try {
    const result = await pool.query(query, [user_email]);
    return result.rows;
  } catch (err) {
    console.error('Error fetching teachers:', err);
    throw err;
  }
};



export const getTeacherById = async (teacherId) => {
  const query = 'SELECT * FROM teacher WHERE id = $1';
  try {
    const result = await pool.query(query, [teacherId]);
    return result.rows[0];
  } catch (err) {
    console.error('Error fetching teacher:', err);
    throw err;
  }
};

export const updateTeacher = async (teacherId, teacherData) => {
  const {
    teacher_name,
    email,
    date_of_birth,
    date_of_joining,
    gender,
    guardian_name,
    qualification,
    experience,
    salary,
    address,
    phone,
    qualification_certificate,
    teacher_photo
  } = teacherData;

  const updateQuery = `
    UPDATE teacher SET
      teacher_name = $1,
      email = $2,
      date_of_birth = $3,
      date_of_joining = $4,
      gender = $5,
      guardian_name = $6,
      qualification = $7,
      experience = $8,
      salary = $9,
      address = $10,
      phone = $11, 
      qualification_certificate = $12, 
      teacher_photo = $13
    WHERE id = $14
    RETURNING *
  `;

  try {
    const result = await pool.query(updateQuery, [
      teacher_name,
      email,
      date_of_birth,
      date_of_joining,
      gender,
      guardian_name,
      qualification,
      experience,
      salary,
      address,
      phone,
      qualification_certificate,
      teacher_photo,
      teacherId
    ]);
    return result.rows[0];
  } catch (err) {
    console.error('Error updating teacher:', err);
    throw err;
  }
};

export const deleteTeacher = async (teacherId) => {
  const deleteTeacherQuery = 'DELETE FROM teacher WHERE id = $1 RETURNING *';
  try {
    const result = await pool.query(deleteTeacherQuery, [teacherId]);
    return result.rows[0];
  } catch (err) {
    console.error('Error deleting teacher:', err);
    throw err;
  }
};

export const getTeacherCount = async (user_email) => {
  const query = 'SELECT COUNT(*) AS totalteachers FROM teacher WHERE user_email = $1';
  const values = [user_email];
  try {
    const result = await pool.query(query, values);
    return result.rows;
  } catch (err) {
    console.error('Error getting teacher count:', err);
    throw err;
  }
};
