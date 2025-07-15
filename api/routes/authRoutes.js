// routes/authRoutes.js
import express from 'express';
import { login, register, changePassword } from '../controllers/authController.js';
import { verifyToken } from '../middlewares/auth.js';
const router = express.Router();

// Authentication routes
router.post('/login', login);
router.post('/register', register);
router.post('/change-password', verifyToken, changePassword);
export default router;