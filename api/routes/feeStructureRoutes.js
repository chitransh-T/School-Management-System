import express from 'express';
import { registerFeeStructure ,getFeeStructureByClass ,deleteFeeStructureByClass} from '../controllers/feeStructureController.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

router.post('/registerfee', verifyToken, registerFeeStructure);
router.get('/feestructure/:class_id', verifyToken, getFeeStructureByClass);
router.delete('/feestructure/:class_id', verifyToken, deleteFeeStructureByClass);

export default router;