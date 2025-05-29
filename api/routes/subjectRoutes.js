// routes/studentRoutes.js
import express from 'express';
import { verifyToken } from '../middlewares/auth.js';
import { 
  registerSubject,
  getAllSubjects,
  updateSubject,
  deleteSubject,
} from '../controllers/subjectController.js';

const router = express.Router();

// Student routes (all protected by JWT authentication)
router.post('/registersubject', verifyToken,registerSubject);
router.get('/getallsubjects', verifyToken, getAllSubjects);
// router.put('/updatesubject',updateSubject)
router.put('/updatesubject',
  verifyToken,
  updateSubject,
     // Your update controller
);
router.delete('/deletesubject/:subject_id', verifyToken, deleteSubject);
export default router;