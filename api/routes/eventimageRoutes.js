import express from 'express';
import { verifyToken } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';
import { uploadEventImages , getTeacherEventImages , getEventImagesForParent} from '../controllers/eventimageController.js';

const router = express.Router();

router.post('/upload-event-images', verifyToken, upload, uploadEventImages);
router.get('/teacher/event-images', verifyToken, getTeacherEventImages);
router.get('/parent/event-images', verifyToken, getEventImagesForParent);
export default router;
