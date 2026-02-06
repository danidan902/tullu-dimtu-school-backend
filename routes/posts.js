// routes/posts.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import Post from '../models/Post.js';

const router = express.Router();

// Validation middleware
const validatePost = [
  body('title').notEmpty().trim().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('category').isIn(['Academic', 'Sports', 'Event', 'Announcement', 'Urgent', 'General'])
    .withMessage('Invalid category'),
  body('author').notEmpty().trim().withMessage('Author name is required'),
  body('date').optional().isString(),
  body('imageUrl').optional().isString(),
  body('tags').optional().isArray(),
  body('status').optional().isIn(['draft', 'published', 'archived'])
];

// @route   POST /api/posts
// @desc    Create a new post (from DirectorPage)
// @access  Public
router.post('/', validatePost, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map(err => err.msg)
      });
    }

    const { title, content, category, author, date, imageUrl, tags, status } = req.body;
    
    // Generate unique ID similar to your frontend
    const newsId = req.body.id || Date.now();
    
    // Create new post
    const newPost = new Post({
      title: title.trim(),
      content: content.trim(),
      category,
      author: author.trim(),
      date: date || new Date().toISOString().split('T')[0],
      timestamp: req.body.timestamp || Date.now(),
      imageUrl: imageUrl || '',
      tags: tags || [],
      status: status || 'published',
      newsId: `post_${newsId}`
    });

    // Save to database
    const savedPost = await newPost.save();
    
    console.log('✅ Post created:', savedPost.title);
    
    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: savedPost
    });

  } catch (error) {
    console.error('❌ Post creation error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A post with similar title already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating post',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/posts
// @desc    Get all posts with filtering (for DirectorPage listing)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      author, 
      status = 'published',
      page = 1, 
      limit = 20,
      sort = '-createdAt',
      search,
      tag 
    } = req.query;

    // Build query
    let query = {};
    
    if (category) query.category = category;
    if (author) query.author = new RegExp(author, 'i');
    if (status) query.status = status;
    if (tag) query.tags = tag;
    
    // Search functionality
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { content: new RegExp(search, 'i') },
        { excerpt: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') }
      ];
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Execute query
    const posts = await Post.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count
    const totalPosts = await Post.countDocuments(query);
    
    res.json({
      success: true,
      totalPosts,
      currentPage: pageNum,
      totalPages: Math.ceil(totalPosts / limitNum),
      posts: posts.map(post => ({
        ...post,
        id: post.newsId || post._id, // Map _id to id for frontend compatibility
        date: post.date
      }))
    });

  } catch (error) {
    console.error('❌ Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching posts'
    });
  }
});

// @route   GET /api/posts/:id
// @desc    Get single post by ID or newsId
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    let post;
    
    // Try to find by newsId first, then by MongoDB _id
    if (req.params.id.startsWith('post_') || req.params.id.startsWith('news_')) {
      post = await Post.findOne({ newsId: req.params.id });
    } else {
      post = await Post.findById(req.params.id);
    }
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Increment view count
    post.views += 1;
    await post.save();

    res.json({
      success: true,
      post: {
        ...post.toObject(),
        id: post.newsId || post._id // Map for frontend
      }
    });

  } catch (error) {
    console.error('❌ Get single post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching post'
    });
  }
});

// @route   PUT /api/posts/:id
// @desc    Update a post (from DirectorPage edit)
// @access  Public
router.put('/:id', validatePost, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map(err => err.msg)
      });
    }

    let post;
    
    // Find post by newsId or _id
    if (req.params.id.startsWith('post_') || req.params.id.startsWith('news_')) {
      post = await Post.findOne({ newsId: req.params.id });
    } else {
      post = await Post.findById(req.params.id);
    }
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const { title, content, category, author, date, imageUrl, tags, status } = req.body;
    
    // Update post
    const updateData = {
      title: title.trim(),
      content: content.trim(),
      category,
      author: author.trim(),
      date: date || post.date,
      imageUrl: imageUrl || post.imageUrl,
      tags: tags || post.tags,
      status: status || post.status,
      updatedAt: Date.now()
    };

    const updatedPost = await Post.findByIdAndUpdate(
      post._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Post updated successfully',
      post: {
        ...updatedPost.toObject(),
        id: updatedPost.newsId || updatedPost._id
      }
    });

  } catch (error) {
    console.error('❌ Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating post'
    });
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post (from DirectorPage)
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    let post;
    
    // Find post by newsId or _id
    if (req.params.id.startsWith('post_') || req.params.id.startsWith('news_')) {
      post = await Post.findOne({ newsId: req.params.id });
    } else {
      post = await Post.findById(req.params.id);
    }
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    await Post.findByIdAndDelete(post._id);
    
    console.log('🗑️ Post deleted:', post.title);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting post'
    });
  }
});

// @route   GET /api/posts/stats/overview
// @desc    Get post statistics (for DirectorPage dashboard)
// @access  Public
router.get('/stats/overview', async (req, res) => {
  try {
    const totalPosts = await Post.countDocuments();
    const publishedPosts = await Post.countDocuments({ status: 'published' });
    const totalViews = await Post.aggregate([
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]);
    
    // Category distribution
    const categoryStats = await Post.aggregate([
      { $match: { status: 'published' } },
      { $group: { 
        _id: '$category', 
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } }
    ]);
    
    // Author distribution
    const authorStats = await Post.aggregate([
      { $match: { status: 'published' } },
      { $group: { 
        _id: '$author', 
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Recent posts count (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentCount = await Post.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
      status: 'published'
    });

    res.json({
      success: true,
      stats: {
        totalPosts,
        publishedPosts,
        draftPosts: totalPosts - publishedPosts,
        totalViews: totalViews[0]?.total || 0,
        recentCount,
        byCategory: categoryStats.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        byAuthor: authorStats.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        totalAuthors: authorStats.length
      }
    });

  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
});

// @route   POST /api/posts/bulk/delete
// @desc    Bulk delete posts (for DirectorPage bulk actions)
// @access  Public
router.post('/bulk/delete', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No post IDs provided for deletion'
      });
    }

    // Find and delete posts
    const deletePromises = ids.map(async (id) => {
      let post;
      if (id.startsWith('post_') || id.startsWith('news_')) {
        post = await Post.findOne({ newsId: id });
      } else {
        post = await Post.findById(id);
      }
      
      if (post) {
        await Post.findByIdAndDelete(post._id);
        return { id, success: true };
      }
      return { id, success: false, message: 'Post not found' };
    });

    const results = await Promise.all(deletePromises);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`🗑️ Bulk delete: ${successCount} success, ${failCount} failed`);

    res.json({
      success: true,
      message: `Deleted ${successCount} post(s) successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
      results
    });

  } catch (error) {
    console.error('❌ Bulk delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk deletion'
    });
  }
});

export default router;