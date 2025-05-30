

// models/userModelPG.js
// import pool from '../config/db.js'; // PostgreSQL pool

// export const findUserByEmailPG = async (email) => {
//   const query = 'SELECT * FROM signup WHERE email = $1';
//   const { rows } = await pool.query(query, [email]);
//   return rows;
// };

// export const findUserByCredentialsPG = async (email, password) => {
//   const query = 'SELECT * FROM signup WHERE email = $1 AND password = $2';
//   const { rows } = await pool.query(query, [email, password]);
//   return rows;
// };

// export const findUserByCredentialsAndRolePG = async (email, password, role) => {
//   const query = 'SELECT * FROM signup WHERE email = $1 AND password = $2 AND role = $3';
//   const { rows } = await pool.query(query, [email, password, role]);
//   return rows;
// };

// export const createUserPG = async (userData) => {
//   const { email, phone, password, confirmpassword, role } = userData;
//   const query = `
//     INSERT INTO signup (email, phone, password, confirmpassword, role)
//     VALUES ($1, $2, $3, $4, $5)
//   `;
//   await pool.query(query, [email, phone, password, confirmpassword, role]);
// };

// export const findStudentByCredentialsPG = async (username, password) => {
//   const query = 'SELECT * FROM students WHERE username = $1 AND password = $2';
//   const { rows } = await pool.query(query, [username, password]);
//   return rows;
// };

// models/userModelPG.js
import pool from '../config/db.js'; // PostgreSQL pool
import bcrypt from 'bcrypt';

export const findUserByEmailPG = async (email) => {
  const query = 'SELECT * FROM signup WHERE email = $1';
  const { rows } = await pool.query(query, [email]);
  return rows;
};


export const findUserByCredentialsAndRolePG = async (email, password, role) => {
  const query = 'SELECT * FROM signup WHERE email = $1 AND password = $2 AND role = $3';
  const { rows } = await pool.query(query, [email, password, role]);
  return rows;
};



export const createUserPG = async (userData) => {
  const { email, phone, password, role } = userData;

  // 🔐 Password hash करें
  const hashedPassword = await bcrypt.hash(password, 10);

  const query = `
    INSERT INTO signup (email, phone, password, role)
    VALUES ($1, $2, $3, $4)
  `;
  await pool.query(query, [email, phone, hashedPassword, role]);
};

export const findStudentByCredentialsPG = async (username, password) => {
  const query = 'SELECT * FROM students WHERE username = $1 AND password = $2';
  const { rows } = await pool.query(query, [username, password]);
  return rows;
};