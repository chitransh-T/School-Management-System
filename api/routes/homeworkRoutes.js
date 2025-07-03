// routes/studentRoutes.js
import express from 'express';
import { verifyToken } from '../middlewares/auth.js';
import { 
  assignHomework,
  getTeacherHomework,
  deleteTeacherHomework,
  getHomework
} from '../controllers/homeworkController.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

// Student routes (all protected by JWT authentication)
router.post('/homework', verifyToken,upload, assignHomework);
router.get('/gethomework', verifyToken,getTeacherHomework);
router.delete('/deletehomework/:id',verifyToken, deleteTeacherHomework);
router.get('/gethomeworkforparent', verifyToken,getHomework);

export default router;