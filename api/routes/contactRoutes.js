import express from 'express';
const router = express.Router();
import { sendContactEmail } from '../controllers/contactController.js';

router.post('/contact', sendContactEmail);

export default router;
