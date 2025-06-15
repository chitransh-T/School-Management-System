

import pool from '../config/db.js';
export const createTeacher = async (teacherData) => {
  const {
    teacher_name,
    date_of_birth,
    date_of_joining,
    gender,
    guardian_name,
    qualification,
    experience,
    salary,
    address,
    qualification_certificate,
    teacher_photo,
    signup_id
  } = teacherData;

  const sql = `
    INSERT INTO teacher (
      teacher_name,
      date_of_birth,
      date_of_joining,
      gender,
      guardian_name,
      qualification,
      experience,
      salary,
      address,
    
      qualification_certificate,
      teacher_photo,
      signup_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `;

  const values = [
    teacher_name,
    date_of_birth,
    date_of_joining,
    gender,
    guardian_name,
    qualification,
    experience,
    salary,
    address,
    qualification_certificate,
    teacher_photo,
    signup_id
  ];

  // console.log("Insert values count:", values.length); // Should be 14
  // console.log("Insert values:", values);

  try {
    const result = await pool.query(sql, values);
    return result.rows[0];
  } catch (err) {
    console.error('Error creating teacher:', err);
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
export const getTeachersBySchoolId = async (signup_id) => {
  const query = `
    SELECT t.*
    FROM teacher t
    JOIN signup s ON t.signup_id = s.id
    WHERE s.school_id = (SELECT school_id FROM signup WHERE id = $1)
  `;
  try {
    const result = await pool.query(query, [signup_id]);
    // console.log('getTeachersBySchoolId result:', result.rows);
    return result.rows;
  } catch (err) {
    console.error('Error fetching teachers by school_id:', err);
    throw err;
  }
};


export const updateTeacher = async (teacherId, teacherData) => {
  const {
    teacher_name,
    date_of_birth,
    date_of_joining,
    gender,
    guardian_name,
    qualification,
    experience,
    salary,
    address,
    // phone,
    qualification_certificate,
    teacher_photo
  } = teacherData;

  const updateQuery = `
    UPDATE teacher SET
      teacher_name = $1,
      date_of_birth = $2,
      date_of_joining = $3,
      gender = $4,
      guardian_name = $5,
      qualification = $6,
      experience = $7,
      salary = $8,
      address = $9,
    
      qualification_certificate = $10,
      teacher_photo = $11
    WHERE id = $12
    RETURNING *
  `;

  try {
    const result = await pool.query(updateQuery, [
      teacher_name,
      date_of_birth,
      date_of_joining,
      gender,
      guardian_name,
      qualification,
      experience,
      salary,
      address,
      // phone,
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



export const getTeacherCount = async (signup_id) => {
  // console.log("Fetching count:", { signup_id });

  const query = `
    SELECT COUNT(*) AS totalteachers 
    FROM teacher 
    WHERE signup_id IN (
      SELECT id FROM signup WHERE school_id = (
        SELECT school_id FROM signup WHERE id = $1
      ) AND role = 'teacher'
    )
  `;

  try {
    const result = await pool.query(query, [signup_id]);
    return result.rows;
  } catch (err) {
    console.error('Error getting teacher count:', err);
    throw err;
  }
};