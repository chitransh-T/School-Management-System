import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import multer from 'multer';
import fs from 'fs';
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import classRoutes from './routes/classRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import feeRoutes from './routes/feeRoutes.js';
import noticeRoutes from './routes/noticeRoutes.js';
// Setup for file path management
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Log all requests
app.use((req, res, next) => {
  // console.log(`${req.method} ${req.url}`);
  next();
});

// Serve static files from the uploads directory
const uploadsPath = path.join(__dirname, 'uploads');
// console.log('Serving static files from:', uploadsPath);

// Ensure uploads directory exists
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Log all files in uploads directory
// console.log('Files in uploads directory:', fs.readdirSync(uploadsPath));

// Serve static files with proper headers and error handling
app.use('/uploads', express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    
    // Set content type based on file extension
    if (filePath.endsWith('.pdf')) {
      res.set('Content-Type', 'application/pdf');
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.set('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.png')) {
      res.set('Content-Type', 'image/png');
    }
  },
  fallthrough: false // This will make express.static send 404 for non-existent files
}));

// Error handler for static file serving
app.use('/uploads', (err, req, res, next) => {
  if (err) {
    // console.error('Error serving static file:', err);
    const filePath = path.join(uploadsPath, req.url);
    // console.log('File request details:', {
    //   url: req.url,
    //   fullPath: filePath,
    //   exists: fs.existsSync(filePath),
    //   availableFiles: fs.readdirSync(uploadsPath)
    // });
    res.status(404).json({
      message: 'File not found',
      requestedPath: req.url,
      fullPath: filePath,
      availableFiles: fs.readdirSync(uploadsPath)
    });
  } else {
    next();
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', studentRoutes);
app.use('/api', attendanceRoutes);
app.use('/api',teacherRoutes);
app.use('/api',classRoutes);
app.use('/api',subjectRoutes);
app.use('/api',feeRoutes);
app.use('/api',noticeRoutes);

// If no route matches, return 404
app.use((req, res) => {
  // console.log('404 for route:', req.url);
  res.status(404).json({ 
    message: 'Route not found',
    path: req.url
  });
});
export default app;