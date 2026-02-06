// models/Post.js
import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Academic', 'Sports', 'Event', 'Announcement', 'Urgent', 'General'],
    default: 'Announcement'
  },
  author: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true
  },
  authorId: {
    type: String,
    default: 'director_portal'
  },
  excerpt: {
    type: String,
    maxlength: 300
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  tags: [{
    type: String,
    trim: true
  }],
  imageUrl: {
    type: String,
    default: ''
  },
  readTime: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: String
  }],
  date: {
    type: String,
    required: true
  },
  timestamp: {
    type: Number,
    default: Date.now
  },
  newsId: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Generate excerpt before saving
postSchema.pre('save', function(next) {
  // Generate excerpt if not provided
  if (!this.excerpt && this.content) {
    this.excerpt = this.content.substring(0, 150) + (this.content.length > 150 ? '...' : '');
  }
  
  // Calculate read time (approx 200 words per minute)
  if (this.content) {
    const wordCount = this.content.split(/\s+/).length;
    this.readTime = Math.max(1, Math.ceil(wordCount / 200));
  }
  
  // Generate unique newsId if not provided
  if (!this.newsId) {
    this.newsId = `news_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  next();
});

// Virtual for formatted date
postSchema.virtual('formattedDate').get(function() {
  return new Date(this.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

const Post = mongoose.model('Post', postSchema);

export default Post;