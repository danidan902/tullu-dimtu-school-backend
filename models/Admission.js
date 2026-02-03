// const mongoose = require('mongoose');
import mongoose from 'mongoose';

const AdmissionSchema = new mongoose.Schema({
  // Personal Details
  fayida: {
    type: String,
    required: [true, 'FAN is required'],
    trim: true,
    // minlength: [1, 'Age must be at least 1 digit']
  },

  program:{
  type: String, 
    trim: true,
    required: [true, 'Media Of Instruction is required']
  },
  field: {
    type: String, 
    trim: true,
    required: [true, 'Field is required']
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    trim: true,
    minlength: [1, 'Age must be at least 1 digit']
  },
  firstName: { 
    type: String, 
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters']
  },
  lastName: { 
    type: String, 
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters']
  },
  grandParentName: { 
    type: String, 
    trim: true,
    required: [true, 'Grandparent name is required'],
  },
  gender: { 
    type: String, 
    required: [true, 'Gender is required'],
    enum: ['male', 'female', 'other']
  },
  dob: { 
    type: Date, 
    required: [true, 'Date of birth is required']
  },
  nationality: { 
    type: String, 
    // default: '',
    trim: true,
    required: [true, 'Media Of Instruction is required']
  },
  religion: { 
    type: String, 
    trim: true
  },
  

  photo: {
    public_id: { type: String }, 
    url: { type: String },        
    secure_url: { type: String }  
  },
  
  
  applyingGrade: { 
    type: String, 
    required: [true, 'Applying grade is required'],
    trim: true
  },
  lastSchool: { 
    type: String, 
    required: [true, 'Last school is required'],
    trim: true
  },
  lastGrade: { 
    type: String, 
    required: [true, 'Last grade is required'],
    trim: true
  },
  gradeAverage: { 
    type: String, 
    trim: true
  },
  
  
  parentName: { 
    type: String, 
    required: [true, 'Parent name is required'],
    trim: true
  },
  relationship: { 
    type: String, 
    required: [true, 'Relationship is required'],
    trim: true
  },
  parentPhone: { 
    type: String, 
    required: [true, 'Parent phone is required'],
    trim: true
  },
  parentEmail: { 
    type: String, 
    required: [true, 'Parent email is required'],
    trim: true,
    lowercase: true
  },
  parentOccupation: { 
    type: String, 
    trim: true
  },
  address: { 
    type: String, 
    required: [true, 'Address is required'],
    trim: true
  },
  
  // Documents stored in Cloudinary
  birthCertificate: {
    public_id: String,
    url: String,
    secure_url: String
  },
  transcript: {
    public_id: String,
    url: String,
    secure_url: String
  },
  transferCertificate: {
    public_id: String,
    url: String,
    secure_url: String
  },
  ParentPhoto: {
    public_id: String,
    url: String,
    secure_url: String
  },
  clearance: {
    public_id: String,
    url: String,
    secure_url: String
  },
   
   faydaId: {
    public_id: String,
    url: String,
    secure_url: String
   },
  
  // Payment Information
  paymentReceipt: {
    public_id: String,
    url: String,
    secure_url: String
  },
 
  paymentVerified: { 
    type: Boolean, 
    default: false 
  },
  
  // Status
  status: { 
    type: String, 
    default: 'pending', 
    enum: ['pending', 'reviewed', 'accepted', 'rejected'] 
  },
  
  // Student folder info
  studentId: {
    type: String,
    required: true
  },
  studentFolder: {
    type: String
  },

  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  condition: {
    type: String,
    trim: true,
    default: 'N/A'
  }

});

// Update timestamp on save
AdmissionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for full name
AdmissionSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// module.exports = mongoose.model('Admission', AdmissionSchema); 
export default mongoose.model('Admission', AdmissionSchema);