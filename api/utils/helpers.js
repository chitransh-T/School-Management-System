// utils/helpers.js
import path from 'path';

// Helper to generate a unique filename
export const generateUniqueFilename = (originalFilename) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  return uniqueSuffix + '-' + originalFilename;
};

// Helper to get file extension
export const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

// Helper to validate file extension
export const isValidFileExtension = (extension, allowedExtensions) => {
  return allowedExtensions.includes(extension);
};

// More helper functions can be added as needed