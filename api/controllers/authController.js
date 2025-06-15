

// controllers/authController.js
// controllers/authController.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import {
  findUserByEmailPG,
  createUserPG,
  findStudentByCredentialsPG
} from '../models/userModel.js';
import { JWT_SECRET_KEY } from '../middlewares/auth.js';

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await findUserByEmailPG(email);
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        school_id: user.school_id
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

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const register = async (req, res) => {
  const { email, phone, password, confirmpassword, role, school_id } = req.body;

  if (!email || !phone || !password || !confirmpassword || !role || !school_id) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  if (password !== confirmpassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match' });
  }

  try {
    const existingUser = await findUserByEmailPG(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const user = await createUserPG({ email, phone, password, role, school_id });

    return res.status(200).json({
      success: true,
      message: 'User registered successfully',
      userId: user.id
    });

  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
