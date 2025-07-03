// ==============================================
import pool from '../config/db.js';

export const createSessionInDB = async ({ session_name, start_date, end_date, signup_id }) => {
  // Deactivate old active sessions for the same school
  await pool.query(`
    UPDATE sessions 
    SET is_active = FALSE 
    WHERE is_active = TRUE AND signup_id IN (
      SELECT id FROM signup WHERE school_id = (
        SELECT school_id FROM signup WHERE id = $1
      )
    )
  `, [signup_id]);

  // Insert new active session
  const query = `
    INSERT INTO sessions (session_name, start_date, end_date, signup_id, is_active)
    VALUES ($1, $2, $3, $4, TRUE)
    RETURNING *;
  `;
  const values = [session_name, start_date, end_date, signup_id];
  return await pool.query(query, values);
};

export const getSessionsFromDB = async (signup_id) => {
  const query = `
    SELECT s.id, s.session_name, s.start_date, s.end_date, s.is_active
    FROM sessions s
    JOIN signup u ON s.signup_id = u.id
    WHERE u.school_id = (
      SELECT school_id FROM signup WHERE id = $1
    )
    ORDER BY s.created_at DESC;
  `;
  const result = await pool.query(query, [signup_id]);
  return result.rows;
};

export const updateSessionInDB = async ({ id, session_name, start_date, end_date }) => {
  const query = `
    UPDATE sessions
    SET session_name = $1,
        start_date = $2,
        end_date = $3
    WHERE id = $4
    RETURNING *;
  `;
  const values = [session_name, start_date, end_date, id];

  const result = await pool.query(query, values);
  return result.rows[0];
};

export const deleteSession = async (id, signup_id, callback) => {
  const query = 'DELETE FROM sessions WHERE id = $1 AND signup_id = $2';

  try {
    const result = await pool.query(query, [id, signup_id]);
    callback(null, { rowCount: result.rowCount });
  } catch (err) {
    console.error('PostgreSQL Error in deleteSession:', err);
    callback(err, null);
  }
};

export const getActiveSessionFromDB = async (signup_id) => {
  const query = `
    SELECT s.*
    FROM sessions s
    JOIN signup u ON s.signup_id = u.id
    WHERE u.school_id = (
      SELECT school_id FROM signup WHERE id = $1
    )
    AND s.is_active = TRUE
    LIMIT 1
  `;
  const result = await pool.query(query, [signup_id]);
  return result.rows[0];
};
