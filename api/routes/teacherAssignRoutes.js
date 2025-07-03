import express from 'express';
import { 
  assignTeacherToClass, 
  getAllTeacherAssignments,
  getClassTeachers
} from '../controllers/teacherAssignController.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

router.post('/assign-teacher', verifyToken, assignTeacherToClass);
router.get('/teacher-assignments', verifyToken, getAllTeacherAssignments);
router.get('/class-teachers/:class_id/:section', verifyToken, getClassTeachers);

export default router;