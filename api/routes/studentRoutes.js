

// routes/studentRoutes.js
import express from 'express';
import { verifyToken } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';
import { 
  registerStudent, 
  getAllStudents, 
  updateStudentDetails, 
  deleteStudentById, 
  getStudentsByClassName,
  getTotalStudentCount,
  modelgetStudentCountByClass,
  ggetLastRegistrationNumber,
  getStudentDashboardDetails
} from '../controllers/studentController.js';

const router = express.Router();

// Student routes (all protected by JWT authentication)
router.post('/registerstudent', verifyToken, upload, registerStudent);
router.get('/students', verifyToken, getAllStudents);
router.put('/students/:id', verifyToken, upload, updateStudentDetails);
router.delete('/students/:id', verifyToken, deleteStudentById);
router.get('/students/:class', verifyToken, getStudentsByClassName);
router.get('/api/students/count',verifyToken, getTotalStudentCount);
router.get('/api/students/count-by-class', verifyToken,modelgetStudentCountByClass);
router.get('/last-registration-number', verifyToken, ggetLastRegistrationNumber);
// Add this to your studentRoutes.js
router.get('/students/dashboard/:id', verifyToken, getStudentDashboardDetails);


export default router;