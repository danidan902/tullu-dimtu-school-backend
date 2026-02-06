import express from 'express';
import multer from 'multer';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();
const router = express.Router();

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI is not defined in environment variables');
      return;
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
  }
};

connectDB();

// MongoDB model
const FileSchema = new mongoose.Schema({
  name: String,
  url: String,
  publicId: String,
  uploadedAt: { type: Date, default: Date.now }
});
const File = mongoose.model('File', FileSchema);

// Multer config with better error handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure uploads directory exists
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Clean filename and add timestamp
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, Date.now() + '-' + cleanName);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Max 10 files
  },
  fileFilter: (req, file, cb) => {
    // Accept all files for now
    cb(null, true);
  }
});

// ✅ POST /api/upload
router.post('/', upload.array('files', 10), async (req, res) => {
  console.log('Upload request received');
  
  // Check if files were uploaded
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ 
      error: 'No files uploaded',
      message: 'Please select at least one file'
    });
  }

  console.log(`Processing ${req.files.length} files`);

  // Check Cloudinary configuration
  if (!process.env.CLOUDINARY_CLOUD_NAME || 
      !process.env.CLOUDINARY_UPLOAD_PRESET || 
      !process.env.CLOUDINARY_UPLOAD_FOLDER) {
    
    console.error('Missing Cloudinary environment variables');
    
    // Clean up uploaded files
    req.files.forEach(file => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });
    
    return res.status(500).json({ 
      error: 'Server configuration error',
      message: 'Cloudinary is not properly configured'
    });
  }

  try {
    const uploadedFiles = [];

    for (const [index, file] of req.files.entries()) {
      console.log(`Uploading file ${index + 1}/${req.files.length}: ${file.originalname}`);
      
      try {
        // Create form data for Cloudinary
        const formData = new FormData();
        formData.append('file', fs.createReadStream(file.path));
        formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET);
        formData.append('folder', process.env.CLOUDINARY_UPLOAD_FOLDER);

        // Upload to Cloudinary
        const cloudinaryRes = await axios.post(
          `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/upload`,
          formData,
          { 
            headers: formData.getHeaders(),
            timeout: 300000 // 5 minute timeout for large files
          }
        );

        console.log(`Cloudinary upload successful for: ${file.originalname}`);

        // Save to database
        const savedFile = await File.create({
          name: file.originalname,
          url: cloudinaryRes.data.secure_url,
          publicId: cloudinaryRes.data.public_id
        });

        uploadedFiles.push({
          id: savedFile._id,
          name: savedFile.name,
          url: savedFile.url,
          size: file.size,
          uploadedAt: savedFile.uploadedAt
        });

        // Delete local file
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
          console.log(`Local file deleted: ${file.path}`);
        }

      } catch (fileError) {
        console.error(`Error uploading file ${file.originalname}:`, fileError.message);
        
        // Clean up this file
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        
        // Continue with other files
        continue;
      }
    }

    // Check if any files were successfully uploaded
    if (uploadedFiles.length === 0) {
      return res.status(500).json({ 
        error: 'All uploads failed',
        message: 'Could not upload any files to Cloudinary'
      });
    }

    res.json({ 
      success: true,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
      uploadedFiles 
    });

  } catch (err) {
    console.error('Upload process error:', err.message);
    
    // Clean up any remaining files
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    // Send appropriate error response
    let errorMessage = 'Upload failed';
    if (err.code === 'ECONNREFUSED') {
      errorMessage = 'Cannot connect to Cloudinary service';
    } else if (err.response) {
      errorMessage = `Cloudinary error: ${err.response.data.error?.message || err.message}`;
    }

    res.status(500).json({ 
      error: 'Upload failed',
      message: errorMessage,
      detail: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// ✅ GET /api/upload - Get all uploaded files
router.get('/', async (req, res) => {
  try {
    const files = await File.find().sort({ uploadedAt: -1 });
    res.json(files);
  } catch (err) {
    console.error('Fetch files error:', err.message);
    res.status(500).json({ 
      error: 'Failed to fetch files',
      message: err.message 
    });
  }
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    res.json({ 
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      cloudinary: {
        configured: !!(process.env.CLOUDINARY_CLOUD_NAME && 
                      process.env.CLOUDINARY_UPLOAD_PRESET)
      }
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'ERROR',
      error: err.message 
    });
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

    // TODO: Add Cloudinary deletion here if needed

    // Delete from database
    await File.findByIdAndDelete(id);

    res.json({ 
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

// DELETE MULTIPLE FILES
router.delete('/delete/multiple', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        message: 'No files selected' 
      });
    }

    // Validate all IDs
    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
    
    if (validIds.length === 0) {
      return res.status(400).json({ 
        message: 'No valid file IDs provided' 
      });
    }

    // Find files to delete
    const files = await File.find({ _id: { $in: validIds } });

    // TODO: Add Cloudinary deletion here if needed

    // Delete from database
    await File.deleteMany({ _id: { $in: validIds } });

    res.json({ 
      success: true,
      message: `${files.length} files deleted successfully`
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

export default router;
