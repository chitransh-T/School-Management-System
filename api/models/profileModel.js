import pool from '../config/db.js';

export const upsertProfile = async (profileData) => {
  const { institute_name, address, logo, user_email } = profileData;

  const query = `
    INSERT INTO institute_profiles (user_email, institute_name, address, logo)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_email)
    DO UPDATE SET
      institute_name = EXCLUDED.institute_name,
      address = EXCLUDED.address,
      logo = EXCLUDED.logo
    RETURNING *;
  `;

  try {
    return await pool.query(query, [user_email, institute_name, address, logo]);
  } catch (err) {
    console.error('PostgreSQL Error in upsertProfile:', err);
    throw err;
  }
};

export const getProfileByUser = async (user_email) => {
  const query = 'SELECT * FROM institute_profiles WHERE user_email = $1 LIMIT 1';
  try {
    const result = await pool.query(query, [user_email]);
    return result.rows[0];
  } catch (err) {
    console.error('PostgreSQL Error in getProfileByUser:', err);
    throw err;
  }
};