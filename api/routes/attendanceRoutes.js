// routes/attendanceRoutes.js
import express from 'express';
import { verifyToken } from '../middlewares/auth.js';
import { saveAttendance, getAttendanceReportBySection,getTeacherAttendanceOnly ,getStudentAttendanceForParentByMonth,getStudentAttendanceForParentByDate} from '../controllers/attendanceController.js';

const router = express.Router();

// Attendance routes (all protected by JWT authentication)
router.post('/attendance', verifyToken, saveAttendance);
router.get('/attendance/:class/:section/:date', verifyToken, getAttendanceReportBySection);
router.get('/attendance/:date', verifyToken,getTeacherAttendanceOnly);
router.get('/parent/attendance/month/:month', verifyToken, getStudentAttendanceForParentByMonth);
router.get('/parent/attendance/date/:date', verifyToken, getStudentAttendanceForParentByDate);

export default router;