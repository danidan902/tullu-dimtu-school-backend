import express from 'express';
import {
  uploadFiles,
  handleUpload,
  getFiles,
  deleteFile,
} from '../controller/fileController.js';

const router = express.Router();

router.post('/upload', uploadFiles, handleUpload);
router.get('/', getFiles);
router.delete('/:publicId', deleteFile);

export default router;
