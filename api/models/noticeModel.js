import pool from '../config/db.js'; 
// models/noticeModel.js
export const getAllNotices = async (signup_id, callback) => {
  const query = `
  SELECT n.*
  FROM notices n
  JOIN signup s ON n.signup_id = s.id
  WHERE s.school_id = (
    SELECT school_id FROM signup WHERE id = $1
  )
  AND n.end_date >= CURRENT_DATE
  ORDER BY n.notice_date DESC
`;

  try {
    const result = await pool.query(query, [signup_id]);
    callback(null, result.rows);
  } catch (err) {
    console.error('PostgreSQL Error in getAllNotices:', err);
    callback(err, null);
  }
};

export const createNotice = async (noticeData, callback) => {
  const query = `
    INSERT INTO notices (title, content, notice_date, end_date, category, priority, signup_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id
  `;

  const values = [
    noticeData.title,
    noticeData.content,
    noticeData.notice_date,
    noticeData.end_date,
    noticeData.category,
    noticeData.priority,
    noticeData.signup_id
  ];

  try {
    const result = await pool.query(query, values);
    callback(null, { id: result.rows[0].id });
  } catch (err) {
    console.error('PostgreSQL Error in createNotice:', err);
    callback(err, null);
  }
};


// Delete a notice (only if it belongs to the user)
export const deleteNotice = async (id, signup_id, callback) => {
  const query = 'DELETE FROM notices WHERE id = $1 AND signup_id = $2';

  try {
    const result = await pool.query(query, [id, signup_id]);
    callback(null, { rowCount: result.rowCount }); // PostgreSQL uses rowCount
  } catch (err) {
    console.error('PostgreSQL Error in deleteNotice:', err);
    callback(err, null);
  }
};