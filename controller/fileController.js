import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

/* ===============================
   MULTER + CLOUDINARY STORAGE
================================ */
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'teacher_uploads',
    resource_type: 'auto', // REQUIRED for pdf, docx, etc
    public_id: Date.now() + '-' + file.originalname,
  }),
});

export const uploadFiles = multer({ storage }).array('files');


export const handleUpload = (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedFiles = req.files.map(file => ({
      originalName: file.originalname,
      url: file.path,          // Cloudinary URL
      publicId: file.filename, // Needed for delete
    }));

    res.status(200).json({
      message: `✅ Successfully uploaded ${uploadedFiles.length} file(s)`,
      files: uploadedFiles,
    });
  } catch (error) {
    console.error('UPLOAD ERROR:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
};

/* ===============================
   GET FILES (LIST)
================================ */
export const getFiles = async (req, res) => {
  try {
    const result = await cloudinary.search
      .expression('folder:teacher_uploads')
      .sort_by('created_at', 'desc')
      .max_results(50)
      .execute();

    const files = result.resources.map(file => ({
      publicId: file.public_id,
      url: file.secure_url,
      format: file.format,
      size: file.bytes,
      createdAt: file.created_at,
    }));

    res.status(200).json({ files });
  } catch (error) {
    console.error('GET FILES ERROR:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
};


/* ===============================
   DELETE FILE
================================ */
export const deleteFile = async (req, res) => {
  const { publicId } = req.params;

  if (!publicId) {
    return res.status(400).json({ error: 'publicId is required' });
  }

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: 'auto',
    });

    res.status(200).json({ message: '✅ File deleted successfully' });
  } catch (error) {
    console.error('DELETE ERROR:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
};
