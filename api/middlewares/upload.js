

// middlewares/upload.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Setup for file path management
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Directory where files will be stored
const uploadDir = path.join(dirname(__dirname), 'uploads');

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// File filter for validating uploaded files
const fileFilter = (req, file, cb) => {
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (['student_photo', 'teacher_photo', 'logo', 'event_images'].includes(file.fieldname)) {
    const allowedExtensions = ['.jpg', '.jpeg', '.png'];
    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Only JPG, JPEG, and PNG files are allowed for ${file.fieldname.replace('_', ' ')}.`), false);
    }
  } else if (
    ['birth_certificate', 'qualification_certificate', 'homework_pdf'].includes(file.fieldname)
  ) {
    if (fileExtension === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error(`Only PDF files are allowed for ${file.fieldname.replace('_', ' ')}.`), false);
    }
  } else {
    cb(new Error('Unexpected field.'), false);
  }
};

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// Multer middleware
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter
}).fields([
  { name: 'student_photo', maxCount: 1 },
  { name: 'birth_certificate', maxCount: 1 },
  { name: 'teacher_photo', maxCount: 1 },
  { name: 'qualification_certificate', maxCount: 1 },
  { name: 'logo', maxCount: 1 },
  { name: 'event_images', maxCount: 10 },
  { name: 'homework_pdf', maxCount: 1 }, // ✅ added support for homework PDF
]);

export default upload;
export { uploadDir };
