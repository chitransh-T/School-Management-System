import { Router } from 'express';
import { sendMessage, getSentMessages, deleteSentMessage, getTeacherMessagesForParent } from '../controllers/messageController.js';
import { verifyToken } from '../middlewares/auth.js';

const router = Router();

router.post('/send-message', verifyToken, sendMessage);
router.get('/sent-messages', verifyToken, getSentMessages);
router.delete('/sent-messages/:id', verifyToken, deleteSentMessage);
router.get('/teacher-messages-for-parent', verifyToken, getTeacherMessagesForParent);
export default router;