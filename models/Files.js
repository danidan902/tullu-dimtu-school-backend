import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  name: String,
  url: String,
  publicId: String,
  size: Number,
  type: String,
  folder: String,
  uploadedAt: { type: Date, default: Date.now }
});

export default mongoose.model("File", fileSchema);
