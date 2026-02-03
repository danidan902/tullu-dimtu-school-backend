// routes/uploads.js - Upload Routes
// import express from 'express';
// import { v2 as cloudinary } from 'cloudinary';

// const router = express.Router();

// // Configure Cloudinary (this is for optional future signed uploads)
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });      

// // Get upload signature for Cloudinary (unsigned upload preset)
// router.post('/signature', async (req, res) => {
//   try {
//     const { folder = 'study_materials', resource_type = 'auto' } = req.body;
    
//     res.json({
//       success: true,
//       cloudName: process.env.CLOUDINARY_CLOUD_NAME,
//       uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET,
//       folder,
//       resource_type
//     });
//   } catch (error) {
//     console.error('Error getting upload signature:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to generate upload signature',
//       error: error.message 
//     });
//   }
// });

// // Optional: Direct upload endpoint (if you want server-side uploads)
// router.post('/direct', async (req, res) => {
//   try {
//     const { file, folder = 'study_materials' } = req.body;
    
//     if (!file) {
//       return res.status(400).json({
//         success: false,
//         message: 'No file provided'
//       });
//     }
    
//     // This is for base64 encoded files
//     const result = await cloudinary.uploader.upload(file, {
//       folder,
//       resource_type: 'auto'
//     });
    
//     res.json({
//       success: true,
//       url: result.secure_url,
//       publicId: result.public_id,
//       format: result.format,
//       bytes: result.bytes
//     });
//   } catch (error) {
//     console.error('Direct upload error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Direct upload failed',
//       error: error.message
//     });
//   }
// });

// export default router;




import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const router = express.Router();

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer + Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "study_materials",
    resource_type: "raw", // ✅ VERY IMPORTANT
    // format: async () => "pdf",
    type: "upload"
  },
});

const upload = multer({ storage });

// ================================
// ✅ UPLOAD PDF ROUTE
// ================================
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      url: req.file.path,
      publicId: req.file.filename,
      bytes: req.file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Upload failed",
    });
  }
});

export default router;
