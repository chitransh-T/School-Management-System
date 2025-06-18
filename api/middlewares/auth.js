// middlewares/auth.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config(); // Load .env variables

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify JWT token
export const verifyToken = (req, res, next) => {
  let token = req.headers['authorization']; // Get the Authorization header

  if (!token) {
    return res.status(403).json({ success: false, message: 'No token provided' });
  }

  // Handle both formats:
  // 1. "Bearer <token>"
  // 2. "<token>"
  if (token.startsWith('Bearer ')) {
    token = token.substring(7); // Remove "Bearer "
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    // console.log('Decoded JWT payload:', decoded);

    req.signup_id = decoded.id || decoded.signup_id; // Attach user email for use in controllers
      // console.log('req.signup_id set to:', req.signup_id);  // <--- and this
      req.school_id = decoded.school_id;
      req.role = decoded.role;

    next(); // Proceed
  });
};

export const JWT_SECRET_KEY = JWT_SECRET;