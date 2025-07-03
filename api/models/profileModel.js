import pool from '../config/db.js';
export const upsertProfile = async (profileData) => {
  const { institute_name, address, logo, signup_id } = profileData;

  const query = `
    INSERT INTO institute_profiles (signup_id, institute_name, address, logo)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (signup_id)
    DO UPDATE SET
      institute_name = EXCLUDED.institute_name,
      address = EXCLUDED.address,
      logo = EXCLUDED.logo
    RETURNING *;
  `;

  try {
    return await pool.query(query, [signup_id, institute_name, address, logo]);
  } catch (err) {
    console.error('PostgreSQL Error in upsertProfile:', err);
    throw err;
  }
};

export const getProfileBySchoolId = async (signup_id) => {
  const query = `
    SELECT ip.*
    FROM institute_profiles ip
    JOIN signup s ON ip.signup_id = s.id
    WHERE s.school_id = (
      SELECT school_id FROM signup WHERE id = $1
    )
    LIMIT 1
  `;
  try {
    const result = await pool.query(query, [signup_id]);
    return result.rows[0];
  } catch (err) {
    console.error('PostgreSQL Error in getProfileBySchoolId:', err);
    throw err;
  }
};
