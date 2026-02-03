import express from 'express';
import Registration from '../models/Registration.js';

const router = express.Router();

// GET all registrations
router.get('/', async (req, res) => {
  try {
    const registrations = await Registration.find().sort({ registrationDate: -1 });
    
    // Format the response
    const formattedRegistrations = registrations.map(reg => ({
      id: reg._id,
      fullName: reg.fullName,
      phone: reg.phone,
      day: reg.day.toISOString().split('T')[0], // Format as YYYY-MM-DD
      grade: reg.grade,
      role: reg.role,
      program: reg.program,
      registrationDate: reg.registrationDate.toLocaleString(),
      createdAt: reg.createdAt,
      updatedAt: reg.updatedAt
    }));
    
    res.status(200).json({
      success: true,
      count: formattedRegistrations.length,
      data: formattedRegistrations
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET single registration by ID
router.get('/:id', async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: registration
    });
  } catch (error) {
    console.error('Error fetching registration:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// POST create new registration
router.post('/', async (req, res) => {
  try {
    const { fullName, phone, day, grade, role, program } = req.body;
    
    // Basic validation
    if (!fullName || !phone || !day || !grade || !role || !program) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    // Check for duplicate phone on same day
    const existingRegistration = await Registration.findOne({
      phone: phone,
      day: new Date(day)
    });
    
    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already registered for this day'
      });
    }
    
    // Create new registration
    const registration = new Registration({
      fullName,
      phone,
      day: new Date(day),
      grade,
      role,
      program
    });
    
    await registration.save();
    
    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      data: {
        id: registration._id,
        fullName: registration.fullName,
        phone: registration.phone,
        day: registration.day.toISOString().split('T')[0],
        grade: registration.grade,
        role: registration.role,
        program: registration.program,
        registrationDate: registration.registrationDate
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// DELETE registration by ID
router.delete('/:id', async (req, res) => {
  try {
    const registration = await Registration.findByIdAndDelete(req.params.id);
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Registration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting registration:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET registrations by date range
router.get('/filter/by-date', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both startDate and endDate (YYYY-MM-DD format)'
      });
    }
    
    const registrations = await Registration.find({
      day: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ day: 1 });
    
    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    console.error('Error fetching registrations by date:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET registrations by role
router.get('/filter/by-role/:role', async (req, res) => {
  try {
    const { role } = req.params;
    
    const registrations = await Registration.find({ role })
      .sort({ registrationDate: -1 });
    
    res.status(200).json({
      success: true,
      count: registrations.length,
      role: role,
      data: registrations
    });
  } catch (error) {
    console.error('Error fetching registrations by role:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET registrations by program
router.get('/filter/by-program/:program', async (req, res) => {
  try {
    const { program } = req.params;
    
    const registrations = await Registration.find({ program })
      .sort({ registrationDate: -1 });
    
    res.status(200).json({
      success: true,
      count: registrations.length,
      program: program,
      data: registrations
    });
  } catch (error) {
    console.error('Error fetching registrations by program:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET registration statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const total = await Registration.countDocuments();
    
    const byRole = await Registration.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const byProgram = await Registration.aggregate([
      { $group: { _id: "$program", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const byGrade = await Registration.aggregate([
      { $group: { _id: "$grade", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const recent = await Registration.find()
      .sort({ registrationDate: -1 })
      .limit(5)
      .select('fullName role program registrationDate');
    
    res.status(200).json({
      success: true,
      data: {
        totalRegistrations: total,
        byRole: byRole,
        byProgram: byProgram,
        byGrade: byGrade,
        recentRegistrations: recent
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;