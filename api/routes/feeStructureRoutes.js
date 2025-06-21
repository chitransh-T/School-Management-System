import express from 'express';
import { registerFeeStructure ,getFeeStructureByClass } from '../controllers/feeStructureController.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

router.post('/registerfee', verifyToken, registerFeeStructure);
router.get('/feestructure/:class_id', verifyToken, getFeeStructureByClass);

export default router;