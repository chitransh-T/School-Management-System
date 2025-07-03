//models/eventImageModel.js
 import pool from '../config/db.js';

export const insertEventImage = async ({ teacher_id, class_id,title, image }) => {
    const query = `
      INSERT INTO event_images (teacher_id, class_id ,title, image)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    console.log('Executing query:', query, [teacher_id, class_id,title, image]);
    try {
      const result = await pool.query(query, [teacher_id, class_id,title, image]);
      return result.rows[0];
    } catch (err) {
      console.error('PostgreSQL Error in insertEventImage:', err);
      throw err;
    }
  };



export const getEventImagesByTeacherId = async (teacher_id) => {
  const query = `
    SELECT ei.id, ei.title, ei.image, ei.created_at, ei.class_id,
           c.class_name, c.section
    FROM event_images ei
    LEFT JOIN classes c ON ei.class_id = c.id
    WHERE ei.teacher_id = $1
    ORDER BY ei.created_at DESC
  `;

  try {
    const result = await pool.query(query, [teacher_id]);
    return result.rows.map(img => ({
      ...img,
      image_url: `/uploads/${img.image}` // Adjust as needed for frontend
    }));
  } catch (err) {
    console.error('PostgreSQL Error in getEventImagesByTeacherId:', err);
    throw err;
  }
};

//----




export const getEventImagesByParentSignupId = async (parentSignupId) => {
  const classInfoResult = await pool.query(
    `SELECT DISTINCT s.assigned_class, s.assigned_section
     FROM parent_student_link psl
     JOIN students s ON psl.student_id = s.id
     WHERE psl.parent_signup_id = $1`,
    [parentSignupId]
  );

  const classSectionPairs = classInfoResult.rows;

  if (classSectionPairs.length === 0) return [];

  // Build WHERE clause with dynamic bindings
  const classConditions = classSectionPairs
    .map((_, i) => `(class_name = $${i * 2 + 1} AND section = $${i * 2 + 2})`)
    .join(' OR ');

  const values = classSectionPairs.flatMap(({ assigned_class, assigned_section }) => [
    assigned_class,
    assigned_section,
  ]);

  const classIdResult = await pool.query(
    `SELECT id FROM classes WHERE ${classConditions}`,
    values
  );

  const classIds = classIdResult.rows.map(row => row.id);

  if (classIds.length === 0) return [];

  const placeholders = classIds.map((_, i) => `$${i + 1}`).join(', ');

  const imageQuery = `
    SELECT ei.id, ei.title, ei.image, ei.class_id, ei.created_at,
           c.class_name, c.section
    FROM event_images ei
    JOIN classes c ON ei.class_id = c.id
    WHERE ei.class_id IN (${placeholders})
    ORDER BY ei.created_at DESC
  `;

  const imageResult = await pool.query(imageQuery, classIds);

  return imageResult.rows.map((img) => ({
    id: img.id,
    title: img.title,
    image_url: `/uploads/${img.image}`,
    class_name: img.class_name,
    section: img.section,
    created_at: img.created_at,
  }));
};
