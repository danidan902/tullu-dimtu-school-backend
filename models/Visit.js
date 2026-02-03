import mongoose from 'mongoose';

const visitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  organization: {
    type: String,
    trim: true,
    default: '',
    maxlength: [200, 'Organization name cannot exceed 200 characters']
  },
  visitDate: {
    type: Date,
    required: [true, 'Visit date is required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Visit date must be in the future'
    }
  },
  numberOfVisitors: {
    type: Number,
    required: [true, 'Number of visitors is required'],
    min: [1, 'At least 1 visitor is required'],
    max: [50, 'Maximum 50 visitors allowed'],
    default: 1
  },
  purpose: {
    type: String,
    required: [true, 'Purpose of visit is required'],
    enum: {
      values: [
        'prospective-student',
        'educational-partner',
        'research',
        'community-partner',
        'other'
      ],
      message: '{VALUE} is not a valid purpose'
    }
  },
  message: {
    type: String,
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters'],
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  submittedAt: {
    type: Date,
    default: Date.now,
    immutable: true
  }
}, {
  timestamps: true
});

const Visit = mongoose.model('Visit', visitSchema);

export default Visit;