// // middlewares/upload.js
// import multer from 'multer';
// import path from 'path';
// import fs from 'fs';
// import { fileURLToPath } from 'url';
// import { dirname } from 'path';

// // Setup for file path management
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// // Directory where files will be stored
// const uploadDir = path.join(dirname(__dirname), 'uploads');

// // Ensure the upload directory exists
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// // File filter for validating uploaded files
// const fileFilter = (req, file, cb) => {
//   console.log('File details:', {
//     fieldname: file.fieldname,
//     mimetype: file.mimetype,
//     originalname: file.originalname,
//     size: file.size
//   });

//   const fileExtension = path.extname(file.originalname).toLowerCase();

//   if (file.fieldname === 'student_photo' || file.fieldname === 'teacher_photo') {
//     const allowedExtensions = ['.jpg', '.jpeg', '.png'];
//     if (allowedExtensions.includes(fileExtension)) {
//       cb(null, true);
//     } else {
//       cb(new Error(`Only JPG, JPEG, and PNG files are allowed for ${file.fieldname.replace('_', ' ')}.`), false);
//     }
//   } else if (file.fieldname === 'birth_certificate' || file.fieldname === 'qualification_certificate') {
//     if (fileExtension === '.pdf') {
//       cb(null, true);
//     } else {
//       cb(new Error(`Only PDF files are allowed for ${file.fieldname.replace('_', ' ')}.`), false);
//     }
//   } else {
//     cb(new Error('Unexpected field.'), false);
//   }
// };

// // Multer storage configuration
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, uniqueSuffix + '-' + file.originalname);
//   }
// });

// // Multer middleware
// const upload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
//   fileFilter
// }).fields([
//   { name: 'student_photo', maxCount: 1 },
//   { name: 'birth_certificate', maxCount: 1 },
//   { name: 'teacher_photo', maxCount: 1 },
//   { name: 'qualification_certificate', maxCount: 1 }
// ]);

// export default upload;
// export { uploadDir };
// // middlewares/upload.js
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
  console.log('File details:', {
    fieldname: file.fieldname,
    mimetype: file.mimetype,
    originalname: file.originalname,
    size: file.size
  });

  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === 'student_photo' || file.fieldname === 'teacher_photo' || file.fieldname === 'logo') {
    const allowedExtensions = ['.jpg', '.jpeg', '.png'];
    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Only JPG, JPEG, and PNG files are allowed for ${file.fieldname.replace('_', ' ')}.`), false);
    }
  } else if (file.fieldname === 'birth_certificate' || file.fieldname === 'qualification_certificate') {
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
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// Multer middleware
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter
}).fields([
  { name: 'student_photo', maxCount: 1 },
  { name: 'birth_certificate', maxCount: 1 },
  { name: 'teacher_photo', maxCount: 1 },
  { name: 'qualification_certificate', maxCount: 1 },
  { name: 'logo', maxCount: 1 }
]);

export default upload;
export { uploadDir };