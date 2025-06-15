
import express from 'express';
import { createSession , getSessions ,updateSession , deleteSessions} from '../controllers/sessionController.js';
import { verifyToken } from '../middlewares/auth.js'; // this middleware should add signup_id to req

const router = express.Router();

// POST /api/session/create
router.post('/create', verifyToken, createSession);
router.get('/getsession', verifyToken, getSessions);
router.put('/updatesession', verifyToken, updateSession);
router.delete('/session/:id', verifyToken, deleteSessions);


export default router;