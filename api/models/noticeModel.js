import pool from '../config/db.js'; // assuming this is now PostgreSQL (pg Pool)

// Fetch all notices for a specific user
export const getAllNotices = async (user_email, callback) => {
  const query = 'SELECT * FROM notices WHERE user_email = $1 ORDER BY notice_date DESC';

  try {
    const result = await pool.query(query, [user_email]);
    callback(null, result.rows); // PostgreSQL returns data in rows
  } catch (err) {
    console.error('PostgreSQL Error in getAllNotices:', err);
    callback(err, null);
  }
};

// Create a new notice
export const createNotice = async (noticeData, callback) => {
  const query = `
    INSERT INTO notices (title, content, notice_date, category, priority, user_email)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id
  `;

  const values = [
    noticeData.title,
    noticeData.content,
    noticeData.notice_date,
    noticeData.category,
    noticeData.priority,
    noticeData.user_email
  ];

  try {
    const result = await pool.query(query, values);
    callback(null, { id: result.rows[0].id }); // Return inserted ID
  } catch (err) {
    console.error('PostgreSQL Error in createNotice:', err);
    callback(err, null);
  }
};

// Delete a notice (only if it belongs to the user)
export const deleteNotice = async (id, user_email, callback) => {
  const query = 'DELETE FROM notices WHERE id = $1 AND user_email = $2';

  try {
    const result = await pool.query(query, [id, user_email]);
    callback(null, { rowCount: result.rowCount }); // PostgreSQL uses rowCount
  } catch (err) {
    console.error('PostgreSQL Error in deleteNotice:', err);
    callback(err, null);
  }
};
