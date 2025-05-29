import express from 'express';
import { verifyToken } from '../middlewares/auth.js';
import * as noticeController from '../controllers/noticeController.js';

const router = express.Router();

// Notice routes (protected by JWT authentication)
router.get('/notices', verifyToken, noticeController.getAllNotices);
router.post('/notices', verifyToken, noticeController.createNotice);
router.delete('/notices/:id', verifyToken, noticeController.deleteNotice);

export default router;
