
// models/userModelPG.js
import pool from '../config/db.js';
import bcrypt from 'bcrypt';

// Get user by email
export const findUserByEmailPG = async (email) => {
  const query = 'SELECT * FROM signup WHERE email = $1';
  const { rows } = await pool.query(query, [email]);
  return rows[0]; // Return single user
};

// Create new user
export const createUserPG = async (userData) => {
  const { email, phone, password, role, school_id } = userData;

  const hashedPassword = await bcrypt.hash(password, 10);
  console.log('Creating user with data:', { email, phone, role, school_id });

  const query = `
    INSERT INTO signup (email, phone, password, role, school_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [email, phone, hashedPassword, role, school_id]);
  return rows[0];
};

// Optional: For student login with username (only if needed)
export const findStudentByCredentialsPG = async (username, password) => {
  const query = 'SELECT * FROM students WHERE username = $1 AND password = $2';
  const { rows } = await pool.query(query, [username, password]);
  return rows;
};
