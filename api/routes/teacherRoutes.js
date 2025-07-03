// routes/studentRoutes.js
import express from 'express';
import { verifyToken } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';
import { 
  registerTeacher,
  getAllTeachers, 
  updateTeacherDetails, 
  deleteTeacherById,
  getTotalTeacherCount ,
  getTeacherDetails,
  getClassTeachers
} from '../controllers/teacherController.js';

const router = express.Router();
// Student routes (all protected by JWT authentication)
router.post('/registerteacher', verifyToken, upload, registerTeacher);
router.get('/teachers', verifyToken, getAllTeachers);
router.get('/teachers/me', verifyToken, getTeacherDetails);
router.put('/teachers/:id', verifyToken, upload, updateTeacherDetails);
router.delete('/teachers/:id', verifyToken, deleteTeacherById);
router.get('/api/teachers/count', verifyToken, getTotalTeacherCount);
router.get('/getclassTeachers/:class_id/:section', verifyToken, getClassTeachers);
export default router;