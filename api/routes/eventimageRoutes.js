import express from 'express';
import { verifyToken } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';
import { uploadEventImages , getTeacherEventImages , getEventImagesForParent, deleteEventImage, getPrincipalEventImages, deletePrincipalEventImage} from '../controllers/eventimageController.js';

const router = express.Router();

router.post('/upload-event-images', verifyToken, upload, uploadEventImages);
router.get('/teacher/event-images', verifyToken, getTeacherEventImages);
router.get('/parent/event-images', verifyToken, getEventImagesForParent);
router.delete('/delete-event-image/:image_id', verifyToken, deleteEventImage);
router.get('/principal/event-images', verifyToken, getPrincipalEventImages);
router.delete('/principal/delete-event-image/:image_id', verifyToken, deletePrincipalEventImage);
export default router;
