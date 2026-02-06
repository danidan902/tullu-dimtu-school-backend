import express from 'express';
import multer from 'multer';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cloudinaryUtils from "../config/cloudinary.js";

dotenv.config();
const router = express.Router();

// MongoDB model
const FileSchema = new mongoose.Schema({
  name: String,
  url: String,
  publicId: String,
  uploadedAt: { type: Date, default: Date.now }
});
const File = mongoose.model('File', FileSchema);

// Multer config (temporary local storage)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Ensure uploads folder exists
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// ✅ POST /api/upload
router.post('/', upload.array('files'), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  try {
    const uploadedFiles = [];

    for (const file of req.files) {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(file.path));
      formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', process.env.CLOUDINARY_UPLOAD_FOLDER);

      // Cloudinary signed upload
      const cloudinaryRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/upload`,
        formData,
        { headers: formData.getHeaders() }
      );

      const savedFile = await File.create({
        name: file.originalname,
        url: cloudinaryRes.data.secure_url,
        publicId: cloudinaryRes.data.public_id
      });

      uploadedFiles.push(savedFile);

      // Delete local file
      fs.unlinkSync(file.path);
    }

    res.json({ uploadedFiles });

  } catch (err) {
    console.error('Cloudinary upload error:', err.message);
    res.status(500).json({ error: 'Upload failed. Check backend console.' });
  }
});


// ✅ GET /api/upload  → Get all uploaded files
router.get('/', async (req, res) => {
  try {
    const files = await File.find().sort({ uploadedAt: -1 }); // newest first
    res.json(files);
  } catch (err) {
    console.error('Fetch files error:', err.message);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});



// DELETE SINGLE FILE
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        message: 'Invalid file ID' 
      });
    }

    // Find the file
    const file = await File.findById(id);
    
    if (!file) {
      return res.status(404).json({ 
        message: 'File not found' 
      });
    }

    // Delete physical file
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // Delete from database
    await File.findByIdAndDelete(id);

    res.json({ 
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      message: 'Server error' 
    });
  }
});




// // // DELETE MULTIPLE FILES
router.delete('/delete/multiple', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        message: 'No files selected' 
      });
    }

    // Find files to delete
    const files = await File.find({ _id: { $in: ids } });

    // Delete physical files
    files.forEach(file => {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });

    // Delete from database
    await File.deleteMany({ _id: { $in: ids } });

    res.json({ 
      message: `${files.length} files deleted successfully`
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      message: 'Server error' 
    });
  }
});






export default router;
