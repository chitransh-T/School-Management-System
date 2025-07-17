//models/eventImageModel.js



import pool from '../config/db.js';

export const insertEventImage = async ({ teacher_id, class_id, title, image, signup_id }) => {
  const query = `
    INSERT INTO event_images (teacher_id, class_id, title, image, signup_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  try {
    const result = await pool.query(query, [teacher_id, class_id, title, image, signup_id]);
    return result.rows[0];
  } catch (err) {
    console.error('PostgreSQL Error in insertEventImage:', err);
    throw err;
  }
};

export const getEventImagesByTeacherSignupId = async (signup_id) => {
  const query = `
    SELECT ei.id, ei.title, ei.image, ei.created_at, ei.class_id,
           c.class_name, c.section,
           t.teacher_name
    FROM event_images ei
    LEFT JOIN classes c ON ei.class_id = c.id
    JOIN teacher t ON ei.teacher_id = t.id
    WHERE ei.signup_id = $1
    ORDER BY ei.created_at DESC
  `;

  try {
    const result = await pool.query(query, [signup_id]);
    return result.rows.map(img => ({
      ...img,
      image_url: `/Uploads/${img.image}`
    }));
  } catch (err) {
    console.error('PostgreSQL Error in getEventImagesByTeacherSignupId:', err);
    throw err;
  }
};

// export const getEventImagesByParentSignupId = async (parentSignupId) => {
//   const classInfoResult = await pool.query(
//     `SELECT DISTINCT s.assigned_class, s.assigned_section
//      FROM parent_student_link psl
//      JOIN students s ON psl.student_id = s.id
//      WHERE psl.parent_signup_id = $1`,
//     [parentSignupId]
//   );

//   const classSectionPairs = classInfoResult.rows;

//   if (classSectionPairs.length === 0) return [];

//   const classConditions = classSectionPairs
//     .map((_, i) => `(class_name = $${i * 2 + 1} AND section = $${i * 2 + 2})`)
//     .join(' OR ');

//   const values = classSectionPairs.flatMap(({ assigned_class, assigned_section }) => [
//     assigned_class,
//     assigned_section,
//   ]);

//   const classIdResult = await pool.query(
//     `SELECT id FROM classes WHERE ${classConditions}`,
//     values
//   );

//   const classIds = classIdResult.rows.map(row => row.id);

//   if (classIds.length === 0) return [];

//   const placeholders = classIds.map((_, i) => `$${i + 1}`).join(', ');

//   const imageQuery = `
//     SELECT ei.id, ei.title, ei.image, ei.class_id, ei.created_at,
//            c.class_name, c.section,
//            t.teacher_name
//     FROM event_images ei
//     JOIN classes c ON ei.class_id = c.id
//     JOIN teacher t ON ei.teacher_id = t.id
//     WHERE ei.class_id IN (${placeholders})
//     ORDER BY ei.created_at DESC
//   `;

//   const imageResult = await pool.query(imageQuery, classIds);

//   return imageResult.rows.map((img) => ({
//     id: img.id,
//     title: img.title,
//     image_url: `/Uploads/${img.image}`,
//     class_name: img.class_name,
//     section: img.section,
//     created_at: img.created_at,
//     teacher_name: img.teacher_name,
//   }));
// };
export const getEventImagesByParentSignupId = async (parentSignupId) => {
  const query = `
    SELECT ei.id,
           ei.title,
           ei.image,
           ei.created_at,
           c.class_name,
           c.section,
           t.teacher_name,
           ts.school_id AS teacher_school_id,
           ss.school_id AS student_school_id,
           cs.school_id AS class_school_id
    FROM parent_student_link psl
    JOIN students s ON psl.student_id = s.id
    JOIN signup ss ON ss.id = s.signup_id -- student's signup
    JOIN classes c ON LOWER(TRIM(c.class_name)) = LOWER(TRIM(s.assigned_class))
                  AND LOWER(TRIM(c.section)) = LOWER(TRIM(s.assigned_section))
    JOIN signup cs ON cs.id = c.signup_id  -- class's signup to get school
    JOIN event_images ei ON ei.class_id = c.id
    JOIN teacher t ON t.id = ei.teacher_id
    JOIN signup ts ON ts.id = t.signup_id -- teacher’s signup
    WHERE psl.parent_signup_id = $1
      AND ts.school_id = ss.school_id -- teacher and student same school
      AND cs.school_id = ss.school_id -- class and student same school
    ORDER BY ei.created_at DESC;
  `;

  const { rows } = await pool.query(query, [parentSignupId]);

  return rows.map(img => ({
    id: img.id,
    title: img.title,
    image_url: `/Uploads/${img.image}`,
    created_at: img.created_at,
    class_name: img.class_name,
    section: img.section,
    teacher_name: img.teacher_name,
  }));
};

export const getEventImagesBySchoolId = async (school_id) => {
  const query = `
    SELECT ei.id, ei.title, ei.image, ei.created_at, ei.class_id,
           c.class_name, c.section,
           t.teacher_name
    FROM event_images ei
    LEFT JOIN classes c ON ei.class_id = c.id
    JOIN teacher t ON ei.teacher_id = t.id
    JOIN signup s ON ei.signup_id = s.id
    WHERE s.school_id = $1
    ORDER BY ei.created_at DESC
  `;

  try {
    const result = await pool.query(query, [school_id]);
    return result.rows.map(img => ({
      ...img,
      image_url: `/Uploads/${img.image}`
    }));
  } catch (err) {
    console.error('PostgreSQL Error in getEventImagesBySchoolId:', err);
    throw err;
  }
};



export const deleteEventImageByPrincipal = async (image_id, school_id) => {
  const query = `
    DELETE FROM event_images ei
    USING signup s
    WHERE ei.id = $1
    AND ei.signup_id = s.id
    AND s.school_id = $2
    RETURNING ei.*;
  `;
  try {
    const result = await pool.query(query, [image_id, school_id]);
    return result.rows[0];
  } catch (err) {
    console.error('PostgreSQL Error in deleteEventImageByPrincipal:', err);
    throw err;
  }
};