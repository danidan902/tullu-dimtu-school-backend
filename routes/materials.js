// routes/materials.js - Material Routes
import express from 'express';
import Material from '../models/Materials.js';

const router = express.Router();

// Get all materials
router.get('/', async (req, res) => {
  try {
    const materials = await Material.find().sort({ uploadDate: -1 });
    
    res.json({   
      success: true,
      count: materials.length,
      data: materials
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch materials',
      error: error.message
    });
  }
});

// Get material by ID
router.get('/:id', async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }
    
    // Increment view count
    material.views += 1;
    await material.save();
    
    res.json({
      success: true,
      data: material
    });
  } catch (error) {
    console.error('Error fetching material:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch material',
      error: error.message
    });
  }
});

// Create/Save material
router.post('/', async (req, res) => {
  try {
    const materialData = req.body;
    
    // Validate required fields
    if (!materialData.title || !materialData.fileUrl || !materialData.cloudinaryPublicId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, fileUrl, cloudinaryPublicId'
      });
    }
    
    const newMaterial = new Material(materialData);
    await newMaterial.save();
    
    res.status(201).json({
      success: true,
      message: 'Material saved successfully',
      data: newMaterial
    });
  } catch (error) {
    console.error('Error saving material:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save material',
      error: error.message
    });
  }
});

// Update material (e.g., increment downloads)
router.put('/:id', async (req, res) => {
  try {
    const { downloads } = req.body;
    const material = await Material.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }
    
    // Update only allowed fields
    if (downloads !== undefined) material.downloads = downloads;
    
    await material.save();
    
    res.json({
      success: true,
      message: 'Material updated successfully',
      data: material
    });
  } catch (error) {
    console.error('Error updating material:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update material',
      error: error.message
    });
  }
});

// Delete material
router.delete('/:id', async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }
    
    await material.deleteOne();
    
    res.json({
      success: true,
      message: 'Material deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete material',
      error: error.message
    });
  }
});

// Get statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const totalMaterials = await Material.countDocuments();
    const totalViews = await Material.aggregate([
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]);
    const totalDownloads = await Material.aggregate([
      { $group: { _id: null, total: { $sum: '$downloads' } } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalMaterials,
        totalViews: totalViews[0]?.total || 0,
        totalDownloads: totalDownloads[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// Search materials
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    
    const materials = await Material.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { subject: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } }
      ]
    }).sort({ uploadDate: -1 });
    
    res.json({
      success: true,  
      count: materials.length,
      data: materials
    });
  } catch (error) {
    console.error('Error searching materials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search materials',
      error: error.message
    });
  }
});

export default router;