import express from 'express';
import Visit from '../models/Visit.js';

const router = express.Router();

// Submit a new visit request
router.post('/', async (req, res) => {
  try {
    const visitData = req.body;
    const visit = new Visit(visitData);
    await visit.save();

    res.status(201).json({
      success: true,
      message: 'Visit request submitted successfully',
      data: visit
    });

  } catch (error) {
    console.error('Error saving visit:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while saving visit request'
    });
  }
});

// Get all visit requests
router.get('/', async (req, res) => {
  try {
    const visits = await Visit.find().sort({ submittedAt: -1 });
    
    res.json({
      success: true,
      count: visits.length,
      data: visits
    });
  } catch (error) {
    console.error('Error fetching visits:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching visits'
    });
  }
});

// Update visit status - FIXED
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log('Updating status for ID:', id, 'to:', status);
    
    // Validate status
    const allowedStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    // Find and update
    const visit = await Visit.findById(id);
    
    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit request not found'
      });
    }

    // Update status
    visit.status = status;
    
    // Set confirmedAt if status is confirmed
    if (status === 'confirmed') {
      visit.confirmedAt = new Date();
    }
    
    await visit.save();

    console.log('Status updated successfully:', visit);

    res.json({
      success: true,
      message: `Visit status updated to ${status}`,
      data: visit
    });

  } catch (error) {
    console.error('Error updating visit status:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating visit status'
    });
  }
});

// Delete visit request
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const visit = await Visit.findByIdAndDelete(id);
    
    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit request not found'
      });
    }

    res.json({
      success: true,
      message: 'Visit request deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting visit:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting visit'
    });
  }
});

export default router;