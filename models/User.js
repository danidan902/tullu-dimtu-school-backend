import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true, trim: true },
    studentId: { type: String, required: true, unique: true, trim: true },
    title: { 
        type: String, 
        required: [true, "Sport is required"], 
        trim: true, 
        enum: ["Football", "Handball", "Tennis", "Athletics"] 
    },
    day: { type: String, required: true }
});

export default mongoose.model("SportUser", userSchema);
