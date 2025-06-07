
// // controllers/authController.js
// import jwt from 'jsonwebtoken';
// import {
//   findUserByEmailPG,
//   createUserPG,
//   findStudentByCredentialsPG
// } from '../models/userModel.js'; // ← PostgreSQL models
// import { JWT_SECRET_KEY } from '../middlewares/auth.js';
// import bcrypt from 'bcrypt';

// export const login = async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     // First try regular user login
//     // const userResults = await findUserByCredentialsPG(email, password);
//     const userResults = await findUserByEmailPG(email); // Just get by email

//     if (userResults.length > 0) {
//       const user = userResults[0];

//       // ✅ hashed password verify करें
//       const isMatch = await bcrypt.compare(password, user.password);

//       if (!isMatch) {
//         return res.status(400).json({ success: false, message: 'Invalid credentials' });
//       }
//       const token = jwt.sign(
//         {
//           email: user.email,
//           role: user.role
//         },
//         JWT_SECRET_KEY,
//         { expiresIn: '1h' }
//       );

//       return res.json({
//         success: true,
//         message: 'Login successful',
//         token,
//         role: user.role
//       });
//     }

//     // Try student login if email doesn't contain @
//     if (typeof email === 'string' && !email.includes('@')) {
//       const studentResults = await findStudentByCredentialsPG(email, password);

//       if (studentResults.length > 0) {
//         const student = studentResults[0];
//         const token = jwt.sign(
//           {
//             id: student.id,
//             username: student.username,
//             user_email: student.user_email,
//             role: 'student'
//           },
//           JWT_SECRET_KEY,
//           { expiresIn: '1h' }
//         );

//         return res.json({
//           success: true,
//           message: 'Login successful',
//           token,
//           role: 'student'
//         });
//       }

//       return res.status(400).json({
//         success: false,
//         message: 'Invalid credentials'
//       });
//     } else {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid credentials'
//       });
//     }

//   } catch (err) {
//     console.error('Login error:', err);
//     return res.status(500).json({ success: false, message: 'Server error' });
//   }
// };

// export const register = async (req, res) => {
//   const { email, phone, password, confirmpassword, role } = req.body;

//   if (!email || !phone || !password || !confirmpassword || !role) {
//     return res.status(400).json({ success: false, message: 'Invalid Credentials' });
//   }

//   try {
//     const existingUsers = await findUserByEmailPG(email);

//     if (existingUsers.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Email already exists'
//       });
//     }

//     await createUserPG({ email, phone, password, confirmpassword, role });

//     return res.status(200).json({
//       success: true,
//       message: 'User registered successfully'
//     });
//   } catch (err) {
//     console.error('Register error:', err);
//     return res.status(500).json({ success: false, message: 'Server error' });
//   }
// };

// controllers/authController.js
import jwt from 'jsonwebtoken';
import {
  findUserByEmailPG,
  createUserPG,
  findStudentByCredentialsPG
} from '../models/userModel.js'; // ← PostgreSQL models
import { JWT_SECRET_KEY } from '../middlewares/auth.js';
import bcrypt from 'bcrypt';

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // First try regular user login
    // const userResults = await findUserByCredentialsPG(email, password);
    const userResults = await findUserByEmailPG(email); // Just get by email

    if (userResults.length > 0) {
      const user = userResults[0];

      // ✅ hashed password verify करें
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Invalid credentials' });
      }
      const token = jwt.sign(
        {
          email: user.email,
          role: user.role
        },
        JWT_SECRET_KEY,
        { expiresIn: '6h' }
      );

      return res.json({
        success: true,
        message: 'Login successful',
        token,
        role: user.role
      });
    }

    // Try student login if email doesn't contain @
    if (typeof email === 'string' && !email.includes('@')) {
      const studentResults = await findStudentByCredentialsPG(email, password);

      if (studentResults.length > 0) {
        const student = studentResults[0];
        const token = jwt.sign(
          {
            id: student.id,
            username: student.username,
            user_email: student.user_email,
            role: 'student'
          },
          JWT_SECRET_KEY,
          { expiresIn: '1h' }
        );

        return res.json({
          success: true,
          message: 'Login successful',
          token,
          role: 'student'
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};




export const register = async (req, res) => {
  const { email, phone, password, confirmpassword, role, school_id } = req.body;

  if (!email || !phone || !password || !confirmpassword || !role || !school_id) {
    return res.status(400).json({ success: false, message: 'Invalid Credentials' });
  }

  try {
    const existingUsers = await findUserByEmailPG(email);

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    await createUserPG({ email, phone, password, confirmpassword, role, school_id });

    return res.status(200).json({
      success: true,
      message: 'User registered successfully'
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};