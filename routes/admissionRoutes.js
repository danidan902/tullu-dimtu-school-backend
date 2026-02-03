import express from 'express';
import * as admissionController from '../controller/admissionController.js';
import upload from '../config/multer.js';
import Admission from '../models/Admission.js';

const router = express.Router();

// Submit admission (with file upload)
router.post('/submit', 
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'birthCertificate', maxCount: 1 },
    { name: 'transcript', maxCount: 1 },
    { name: 'transferCertificate', maxCount: 1 },
    { name: 'paymentReceipt', maxCount: 1 },
    { name: 'faydaId', maxCount: 1 },
    { name: 'ParentPhoto', maxCount: 1 },
    { name: 'clearance', maxCount: 1 }
  ]),
  admissionController.createAdmission
);


router.get('/', admissionController.getAllAdmissions);

router.get('/search', async (req, res) => {
  try {
    const { search, grade } = req.query;
    let query = {};
    
    if (search) {
      const searchTerms = search.trim().split(/\s+/).filter(term => term.length > 0);
      
      // Clean search term for phone number search (remove spaces, dashes, etc.)
      const cleanSearch = search.replace(/[\s\-\(\)\.]/g, '');
      const isPhoneNumber = /^\d+$/.test(cleanSearch) && cleanSearch.length >= 7;
      
      // If search is a phone number (digits only, at least 7 digits)
      if (isPhoneNumber) {
        // Search in parentPhone field for phone numbers
        query.parentPhone = { $regex: cleanSearch, $options: 'i' };
      }
      // If search has less than 2 terms (not phone number)
      else if (searchTerms.length < 2) {
        // Only search non-name fields with single term
        const searchRegex = new RegExp(searchTerms[0], 'i');
        query.$or = [
          { studentId: searchRegex },
          { admissionId: searchRegex },
          { parentPhone: searchRegex }, // Still search phone as text too
          { parentEmail: searchRegex },
          { parentName: searchRegex }
        ];
      } else {
        // For name search: user must provide at least 2 terms
        // We'll treat them as first name and last name combinations
        
        const nameQueries = [];
        
        // For exactly 2 terms: try both as first+last and last+first
        if (searchTerms.length === 2) {
          const [term1, term2] = searchTerms;
          
          // Strict: term1 is first name, term2 is last name
          nameQueries.push({
            $and: [
              { firstName: { $regex: `^${term1}$`, $options: 'i' } },
              { lastName: { $regex: `^${term2}$`, $options: 'i' } }
            ]
          });
          
          // Also try reversed
          nameQueries.push({
            $and: [
              { firstName: { $regex: `^${term2}$`, $options: 'i' } },
              { lastName: { $regex: `^${term1}$`, $options: 'i' } }
            ]
          });
        }
        // For more than 2 terms: user might have middle names
        else {
          // Try: first term = first name, all other terms = last name
          const firstName = searchTerms[0];
          const lastName = searchTerms.slice(1).join(' ');
          nameQueries.push({
            $and: [
              { firstName: { $regex: `^${firstName}$`, $options: 'i' } },
              { lastName: { $regex: `^${lastName}$`, $options: 'i' } }
            ]
          });
          
          // Try: last term = last name, all other terms = first name
          const firstName2 = searchTerms.slice(0, -1).join(' ');
          const lastName2 = searchTerms[searchTerms.length - 1];
          nameQueries.push({
            $and: [
              { firstName: { $regex: `^${firstName2}$`, $options: 'i' } },
              { lastName: { $regex: `^${lastName2}$`, $options: 'i' } }
            ]
          });
        }
        
        // Also add full concatenated name search
        const fullNameSearch = searchTerms.join(' ');
        nameQueries.push({
          $expr: {
            $regexMatch: {
              input: { $concat: ["$firstName", " ", "$lastName"] },
              regex: fullNameSearch,
              options: "i"
            }
          }
        });
        
        query.$or = nameQueries;
      }
    }
    
    // Add grade filter
    if (grade && grade !== 'all') {
      const gradePatterns = {
        '9': /9|nine|grade 9|9th/gi,
        '10': /10|ten|grade 10|10th/gi,
        '11': /11|eleven|grade 11|11th/gi,
        '12': /12|twelve|grade 12|12th/gi
      };

      if (gradePatterns[grade]) {
        query.applyingGrade = { $regex: gradePatterns[grade] };
      }
    }

    const admissions = await Admission.find(query)
      .select('firstName lastName gender parentPhone parentEmail studentId admissionId applyingGrade photo studentPhoto')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: admissions,
      count: admissions.length
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching students'
    });
  }
});

// Get admission stats
router.get('/stats', admissionController.getAdmissionStats);

// Get single admission
router.get('/:id', admissionController.getAdmission);

// Update admission status
router.patch('/:id/status', admissionController.updateAdmissionStatus);

// Delete admission
router.delete('/:id', admissionController.deleteAdmission);

// Get student documents
router.get('/:id/documents', admissionController.getStudentDocuments);

// Download all documents as ZIP
router.get('/:id/documents/download', admissionController.downloadAllDocuments);

export default router;

