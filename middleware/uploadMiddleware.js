// const multer = require('multer');

// // Store files in memory
// const storage = multer.memoryStorage();

// // Configure multer
// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 10 * 1024 * 1024, // 10MB limit per file
//     files: 5 // Max 5 files total
//   },
//   fileFilter: (req, file, cb) => {
//     console.log(`📁 File received: ${file.fieldname} - ${file.originalname} (${file.mimetype})`);
    
//     // Accept all image types and PDFs
//     if (
//       file.mimetype.startsWith('image/') ||
//       file.mimetype === 'application/pdf'
//     ) {
//       cb(null, true);
//     } else {
//       cb(new Error(`Invalid file type: ${file.mimetype}. Only images and PDFs are allowed.`));
//     }
//   }
// });

// // Define expected fields
// const uploadAdmissionFiles = upload.fields([
//   { name: 'photo', maxCount: 1 },
//   { name: 'birthCertificate', maxCount: 1 },
//   { name: 'transcript', maxCount: 1 },
//   { name: 'transferCertificate', maxCount: 1 },
//   { name: 'paymentReceipt', maxCount: 1 },
//   { name: 'studentId', maxCount: 1 }
// ]);

// module.exports = { uploadAdmissionFiles };


// backend/middleware/upload.js
const multer = require('multer');

// Multer config
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only images and PDFs are allowed.`));
    }
  }
});

const uploadAdmissionFiles = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'birthCertificate', maxCount: 1 },
  { name: 'transcript', maxCount: 1 },
  { name: 'transferCertificate', maxCount: 1 },
  { name: 'paymentReceipt', maxCount: 1 },
  { name: 'faydaId', maxCount: 1 },
  { name: 'ParentPhoto', maxCount: 1 },
  { name: 'clearance', maxCount: 1 }
]);

module.exports = { uploadAdmissionFiles };
