import express from 'express';
import { createFeeFields, getFeeFields, deleteAllFeeFields } from '../controllers/feeMasterController.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

router.post('/createfee', verifyToken, createFeeFields);
router.get('/getfee', verifyToken, getFeeFields);
router.delete('/deleteallfee', verifyToken, deleteAllFeeFields);
export default router;
