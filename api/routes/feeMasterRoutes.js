import express from 'express';
import { createFeeFields, getFeeFields } from '../controllers/feeMasterController.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

router.post('/createfee', verifyToken, createFeeFields);
router.get('/getfeefields', verifyToken, getFeeFields);

export default router;