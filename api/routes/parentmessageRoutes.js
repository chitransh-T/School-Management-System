import { Router } from 'express';
import { sendMessage ,getSentMessages,deleteSentMessage ,getMessagesForTeacher} from '../controllers/parentmessageController.js';
import { verifyToken } from '../middlewares/auth.js';

const router = Router();

router.post('/parent-send-message', verifyToken, sendMessage);
router.get('/parent-get-messages', verifyToken, getSentMessages);
router.delete('/parent-delete-message/:id', verifyToken, deleteSentMessage);
router.get('/teacher/messages', verifyToken, getMessagesForTeacher);
export default router;