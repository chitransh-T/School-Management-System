import express from 'express';
import { verifyToken } from '../middlewares/auth.js';
import {
   registerClass,
   getAllClasses,
   updateClassDetails,
   deleteClassById,
   getAssignedClass
} from '../controllers/classController.js';

const router = express.Router();

// Route to create a class
router.post('/classes', verifyToken, registerClass);

// Route to get all classes
router.get('/classes', verifyToken, getAllClasses);

// Route to update a class by ID (Note the :id parameter)
router.put('/classes/:id', verifyToken, updateClassDetails);

// Route to delete a class by ID (Note the :id parameter)
router.delete('/classes/:id', verifyToken, deleteClassById);

// Route to get assigned class
router.get('/assigned-class', verifyToken, getAssignedClass);

export default router;