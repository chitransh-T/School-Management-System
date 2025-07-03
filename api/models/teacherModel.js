// ==============================================================
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
    signup_id,
    session_id
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
      signup_id,
      session_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
    signup_id,
    session_id
  ];

  console.log("Insert values count:", values.length); // Should be 14
  console.log("Insert values:", values);

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
    SELECT 
      t.*,
      s.email AS username,
      s.password
    FROM teacher t
    JOIN signup s ON t.signup_id = s.id
    WHERE s.school_id = (SELECT school_id FROM signup WHERE id = $1)
  `;
  try {
    const result = await pool.query(query, [signup_id]);
    return result.rows;
  } catch (err) {
    console.error('Error fetching teachers by school_id:', err);
    throw err;
  }
};
export const getTeacherBySignupId = async (signup_id) => {
  const query = `
    WITH SubjectAggregates AS (
      SELECT 
        ta.teacher_id,
        ta.class_id,
        ta.section,
        array_agg(s.subject_name ORDER BY s.subject_name) FILTER (WHERE s.subject_name IS NOT NULL) AS subjects
      FROM teacher_assignments ta
      LEFT JOIN subjects s ON ta.subject_id = s.id
      GROUP BY ta.teacher_id, ta.class_id, ta.section
    ),
    StudentAggregates AS (
      SELECT 
        c.id AS class_id,
        c.class_name,
        st.assigned_section,
        json_agg(
          json_build_object(
            'student_name', st.student_name,
            'assigned_class', c.class_name,
            'assigned_section', st.assigned_section
          ) ORDER BY st.student_name
        ) FILTER (WHERE st.id IS NOT NULL) AS students
      FROM classes c
      LEFT JOIN students st 
        ON st.assigned_class = c.class_name 
        AND st.assigned_section = c.section
      GROUP BY c.id, c.class_name, st.assigned_section
    )
    SELECT 
      t.id,
      t.signup_id,
      t.teacher_name,
      t.date_of_birth,
      t.date_of_joining,
      t.gender,
      t.guardian_name,
      t.qualification,
      t.experience,
      t.salary,
      t.address,
      t.qualification_certificate,
      t.teacher_photo,
      t.created_at,
      t.session_id,
      COALESCE(
        json_agg(
          json_build_object(
            'class_name', c.class_name,
            'section', sa.section,
            'subjects', sa.subjects
          ) ORDER BY c.class_name, sa.section
        ) FILTER (WHERE c.id IS NOT NULL),
        '[]'::json
      ) AS assigned_classes,
      COALESCE(
        json_agg(
          sta.students
        ) FILTER (WHERE sta.students IS NOT NULL),
        '[]'::json
      ) AS students
    FROM teacher t
    LEFT JOIN SubjectAggregates sa ON t.id = sa.teacher_id
    LEFT JOIN classes c ON sa.class_id = c.id
    LEFT JOIN StudentAggregates sta 
      ON sta.class_id = c.id 
      AND sta.assigned_section = sa.section
    WHERE t.signup_id = $1
    GROUP BY 
      t.id,
      t.signup_id,
      t.teacher_name,
      t.date_of_birth,
      t.date_of_joining,
      t.gender,
      t.guardian_name,
      t.qualification,
      t.experience,
      t.salary,
      t.address,

      t.qualification_certificate,
      t.teacher_photo,
      t.created_at,
      t.session_id
    ORDER BY t.id;
  `;
  try {
    const result = await pool.query(query, [signup_id]);
    console.log('Database teacher result:', JSON.stringify(result.rows[0], null, 2));
    return result.rows[0];
  } catch (err) {
    console.error('Error fetching teacher by signup_id:', err);
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
    qualification_certificate,
    teacher_photo,
    session_id   // added here
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
      teacher_photo = $11,
      session_id = $12        -- update session_id
    WHERE id = $13
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
      qualification_certificate,
      teacher_photo,
      session_id,   // include in values array
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
export const getTeachersBySessionId = async (sessionId) => {
  const query = 'SELECT * FROM teacher WHERE session_id = $1';
  const result = await pool.query(query, [sessionId]);
  return result.rows;
};

//----




export const getTeachersByClass = async (class_id, section) => {
  const query = `
    SELECT DISTINCT
      t.id as teacher_id,
      t.teacher_name,
      string_agg(s.subject_name, ', ') as subjects
    FROM teacher_assignments ta
    JOIN teacher t ON ta.teacher_id = t.id
    JOIN subjects s ON ta.subject_id = s.id
    WHERE ta.class_id = $1 AND ta.section = $2
    GROUP BY t.id, t.teacher_name
    ORDER BY t.teacher_name
  `;
  
  try {
    const result = await pool.query(query, [class_id, section]);
    return result.rows;
  } catch (err) {
    console.error('PostgreSQL Error in getTeachersByClass:', err);
    throw err;
  }
};