import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  day: {
    type: Date,
    required: true
  },
  grade: {
    type: String,
    required: true,
    enum: ['9th Grade', '10th Grade', '11th Grade', '12th Grade']
  },
  role: {
    type: String,
    required: true,
    enum: ['Student', 'Mentor', 'Instructor', 'Program Coordinator', 'Volunteer', 'Guest Speaker']
  },
  program: {
    type: String,
    required: true,
    enum: ['STEM Program', 'Leadership Program', 'Technology and Innovation', 'Arts and Humanities', 'Cultural Day','Mini Media']
  },
  registrationDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Registration = mongoose.model('AcademicRegistration', registrationSchema);

export default Registration;