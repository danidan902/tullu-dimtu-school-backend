import mongoose from "mongoose";

const concernSchema = new mongoose.Schema({
  name: { type: String, required: true },
  studentId: { type: String, required: true },
  concern: { type: String, required: true },
  urgency: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  details: { type: String }
}, { timestamps: true });     
   
export default mongoose.model("StudentCounsle", concernSchema);
