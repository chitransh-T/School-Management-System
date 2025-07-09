import express from 'express';
import { 
  assignTeacherToClass,
  getAllTeacherAssignments,
  getClassTeachers,
  updateTeacherAssignment,
  deleteTeacherAssignment,
  getTeacherAssignmentById
} from '../controllers/teacherAssignController.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

// Existing routes
router.post('/assign-teacher', verifyToken, assignTeacherToClass);
router.get('/teacher-assignments', verifyToken, getAllTeacherAssignments);
router.get('/class-teachers/:class_id/:section', verifyToken, getClassTeachers);

// New routes for edit and delete
router.get('/teacher-assignment/:id', verifyToken, getTeacherAssignmentById);
router.put('/teacher-assignment/:id', verifyToken, updateTeacherAssignment);
router.delete('/teacher-assignment/:id', verifyToken, deleteTeacherAssignment);

export default router;