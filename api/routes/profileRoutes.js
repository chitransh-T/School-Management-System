
import express from 'express';
import { saveOrUpdateProfile, getProfile } from '../controllers/profileController.js';
import { verifyToken } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

router.post('/profile', verifyToken, upload, saveOrUpdateProfile);
router.get('/profile', verifyToken, getProfile);

export default router;