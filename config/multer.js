import multer from 'multer';
import path from 'path';

// Configure multer for memory storage (no disk storage needed for Cloudinary)
const storage = multer.memoryStorage();

// File filter to accept only certain file types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Only JPEG, PNG, GIF, WebP, and PDF files are allowed. Received: ${file.mimetype}`
      ),
      false
    );
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1 * 1024 * 1024, // ✅ 1MB per file
    files: 8                   // ✅ maximum 8 files per student
  }
});

export default upload;
