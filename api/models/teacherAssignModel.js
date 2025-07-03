import pool from '../config/db.js';

export const assignTeacher = async (assignmentData) => {
  const { teacher_id, class_id, section, subject_ids } = assignmentData;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // First delete existing assignments for this teacher-class-section combination
    await client.query(
      'DELETE FROM teacher_assignments WHERE teacher_id = $1 AND class_id = $2 AND section = $3',
      [teacher_id, class_id, section]
    );
    
    // Insert new assignments for each subject
    const insertPromises = subject_ids.map(subject_id => 
      client.query(
        'INSERT INTO teacher_assignments (teacher_id, class_id, section, subject_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [teacher_id, class_id, section, subject_id]
      )
    );
    
    const results = await Promise.all(insertPromises);
    await client.query('COMMIT');
    
    return {
      rows: results.map(r => r.rows[0])
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
export const getTeacherAssignments = async (school_id) => {
  const query = `
    SELECT 
      ta.id,
      t.id as teacher_id,
      t.teacher_name,
      c.id as class_id,
      c.class_name,
      ta.section,
      s.id as subject_id,
      s.subject_name
    FROM teacher_assignments ta
    JOIN teacher t ON ta.teacher_id = t.id
    JOIN signup u ON t.signup_id = u.id  -- 👈 signup table join
    JOIN classes c ON ta.class_id = c.id
    JOIN subjects s ON ta.subject_id = s.id
    WHERE u.school_id = $1  -- 👈 Filter by school
    ORDER BY c.class_name, ta.section, t.teacher_name
  `;
  
  const result = await pool.query(query, [school_id]);
  return result.rows;
};

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