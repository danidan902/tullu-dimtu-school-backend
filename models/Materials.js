// models/Material.js - Material Schema
import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  subject: { type: String, required: true },
  grade: { type: String, required: true },
  category: { type: String, default: 'lecture' },
  tags: [{ type: String }],
  isPublic: { type: Boolean, default: true },
  allowComments: { type: Boolean, default: true },
  accessLevel: { type: String, default: 'all_students' },
  fileUrl: { type: String, required: true },
  thumbnailUrl: { type: String },
  fileName: { type: String, required: true },
  fileSize: { type: String },
  fileType: { type: String, required: true },
  mimeType: { type: String },
  cloudinaryPublicId: { type: String, required: true },
  cloudinaryThumbnailId: { type: String },
  views: { type: Number, default: 0 },
  downloads: { type: Number, default: 0 },
  uploadDate: { type: Date, default: Date.now }
});

// Add indexes for better query performance
materialSchema.index({ title: 'text', description: 'text', tags: 'text' });
materialSchema.index({ subject: 1 });
materialSchema.index({ grade: 1 });
materialSchema.index({ category: 1 });
materialSchema.index({ uploadDate: -1 });

const Material = mongoose.model('Material', materialSchema);

export default Material;