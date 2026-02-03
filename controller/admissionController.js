import Admission from '../models/Admission.js';
import JSZip from 'jszip';
import path from 'path';
import fs from 'fs';
import cloudinaryUtils from "../config/cloudinary.js";
import { create } from 'domain';

// Then use like:
const { uploadToStudentFolder, deleteStudentFolder } = cloudinaryUtils;
// Helper function to validate and parse date
const validateAndParseDate = (dateString) => {
  if (!dateString) throw new Error('Date of birth is required');
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    throw new Error('Date must be in YYYY-MM-DD format (e.g., 2010-05-15)');
  }
  
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new Error(`Invalid date: ${dateString}. Check month (01-12) and day (01-31)`);
  }
  
  // Age validation
  const today = new Date();
  const minAgeDate = new Date();
  minAgeDate.setFullYear(today.getFullYear() - 3);
  
  if (date > minAgeDate) {
    throw new Error('Student must be at least 3 years old');
  }
  
  return date;
};

// Generate student ID
const generateStudentId = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substr(2, 3).toUpperCase();
  return `${timestamp}${random}`;
};

// ✅ FIXED: Create admission with proper file validation       
export const createAdmission = async (req, res) => {
  console.log('\n🎯 CREATE ADMISSION REQUEST RECEIVED');
  
  try {
    // 1. Validate required files
    if (!req.files || !req.files.photo || !req.files.birthCertificate || !req.files.transcript) {
      return res.status(400).json({
        success: false,
        error: 'Missing required files',
        message: 'Photo, birth certificate, and transcript are required'
      });
    }

    // 2. Extract and validate form data
    const {
      firstName, lastName, gender, dob: dobString, nationality, religion,
      applyingGrade, lastSchool, lastGrade, gradeAverage,
      parentName, relationship, parentPhone, parentEmail,
      parentOccupation, address, age, grandParentName, condition, program, fayida, field
    } = req.body;

    // Validate required fields
    const requiredFields = [
      'firstName', 'lastName', 'gender', 'dob', 
      'applyingGrade', 'lastSchool', 'lastGrade',
      'parentName', 'relationship', 'parentPhone', 'parentEmail', 'address', 'age', 'grandParentName', 'condition', 'program', 'fayida', 'field'
    ];
    
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: `Required: ${missingFields.join(', ')}`
      });
    }

    // Validate date
    let dob;
    try {
      dob = validateAndParseDate(dobString);
      console.log('✅ Date validated:', dob.toISOString().split('T')[0]);
    } catch (dateError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date',
        message: dateError.message
      });
    }

    // 3. Generate student ID
    const studentId = generateStudentId();
    console.log(`🎓 Student ID: ${studentId}`);

    // 4. Upload files with ERROR HANDLING
    console.log('📤 Uploading files...');
    
    const uploadedFiles = {};
    
    // Helper function to handle file upload
    const handleFileUpload = async (fieldName) => {
      try {
        if (!req.files[fieldName]) {
          console.log(`⚠️ No ${fieldName} provided`);
          return null;
        }
        
        const file = req.files[fieldName][0];
        const timestamp = Date.now();
        
        console.log(`   📄 Uploading ${fieldName}: ${file.originalname}`);
        
        const result = await uploadToStudentFolder(
          file.buffer,
          applyingGrade,
          firstName,
          lastName,
          studentId,
          `${fieldName}_${timestamp}_${file.originalname}`
        );
        
        // ✅ CRITICAL FIX: Ensure ALL required fields exist
        if (!result || !result.public_id || !result.secure_url) {
          throw new Error(`Cloudinary response incomplete for ${fieldName}`);
        }
        
        return {
          public_id: result.public_id,
          url: result.url || result.secure_url, // Fallback to secure_url
          secure_url: result.secure_url,
          folder: result.folder || `Grade_${applyingGrade}/${firstName.toLowerCase()}_${lastName.toLowerCase()}_${studentId}`,
          original_name: file.originalname,
          size: file.size,
          mimetype: file.mimetype
        };
      } catch (error) {
        console.error(`   ❌ ${fieldName} upload failed:`, error.message);
        throw error;
      }
    };

    // Upload files sequentially for better error handling
    try {
      // Upload required files
      uploadedFiles.photo = await handleFileUpload('photo');
      uploadedFiles.birthCertificate = await handleFileUpload('birthCertificate');
      uploadedFiles.transcript = await handleFileUpload('transcript');

      
      // Upload optional files if they exist
      if (req.files.transferCertificate) {
        uploadedFiles.transferCertificate = await handleFileUpload('transferCertificate');
      }
       
      if (req.files.faydaId) {
        uploadedFiles.faydaId = await handleFileUpload('faydaId');
      } 

      if (req.files.ParentPhoto) {
        uploadedFiles.ParentPhoto = await handleFileUpload('ParentPhoto');
      }
       
      if (req.files.clearance) {
        uploadedFiles.clearance = await handleFileUpload('clearance');
      }
      
      if (req.files.paymentReceipt) {
        uploadedFiles.paymentReceipt = await handleFileUpload('paymentReceipt');
      }
      
    } catch (uploadError) {
      console.error('❌ File upload failed:', uploadError.message);
      return res.status(500).json({
        success: false,
        error: 'File upload failed',
        message: `Failed to upload files: ${uploadError.message}`,
        details: 'Please check your files and try again'
      });
    }      

    // 5. ✅ CRITICAL: Check if required files uploaded successfully
    if (!uploadedFiles.photo || !uploadedFiles.birthCertificate || !uploadedFiles.transcript) {
      console.error('❌ Required files missing after upload');
      return res.status(500).json({
        success: false,
        error: 'File upload incomplete',
        message: 'Required files (photo, birth certificate, transcript) failed to upload',
        uploaded: {
          photo: !!uploadedFiles.photo,
          birthCertificate: !!uploadedFiles.birthCertificate,
          transcript: !!uploadedFiles.transcript,
          faydaId: !!uploadedFiles.faydaId,
          ParentPhoto: !!uploadedFiles.ParentPhoto,
          clearance: !!uploadedFiles.clearance,
        }
      });
    }

    // 6. ✅ FIXED: Ensure ALL photo fields exist before saving
    const createFileObject = (fileData) => {
      if (!fileData) return undefined;
      
      return {
        public_id: fileData.public_id || `default_${Date.now()}`,
        url: fileData.url || fileData.secure_url || 'https://via.placeholder.com/500',
        secure_url: fileData.secure_url || fileData.url || 'https://via.placeholder.com/500',
        folder: fileData.folder || 'unknown',
        original_name: fileData.original_name || 'unknown',
        size: fileData.size || 0,
        mimetype: fileData.mimetype || 'application/octet-stream'
      };
    };

    console.log('💾 Saving to database...');
        //  this name of this name of this name of this neme of this nem of this name of this name of this name of this 
    const admissionData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gender: gender.trim(),
      dob: dob,
      nationality: (nationality || 'Ethiopian').trim(),
      religion: religion ? religion.trim() : undefined,
      age: age.trim(),
      grandParentName: grandParentName.trim(),
      
      // Academic info
      applyingGrade: applyingGrade.trim(),
      lastSchool: lastSchool.trim(),
      lastGrade: lastGrade.trim(),
      gradeAverage: gradeAverage ? gradeAverage.trim() : undefined,
      program: program.trim(),
      fayida: fayida.trim(),
      field: field.trim(),
      
      // Parent info
      parentName: parentName.trim(),
      relationship: relationship.trim(),
      parentPhone: parentPhone.trim(),
      parentEmail: parentEmail.trim().toLowerCase(),
      parentOccupation: parentOccupation ? parentOccupation.trim() : undefined,
      address: address.trim(),
      condition: condition.trim(),
      
      
      // Student folder info
      studentId: studentId,
      studentFolder: `Grade_${applyingGrade}/${firstName.toLowerCase()}_${lastName.toLowerCase()}_${studentId}`,
      
      // ✅ FIXED: Ensure ALL file objects are properly formed
      photo: createFileObject(uploadedFiles.photo),
      birthCertificate: createFileObject(uploadedFiles.birthCertificate),
      transcript: createFileObject(uploadedFiles.transcript),
      transferCertificate: createFileObject(uploadedFiles.transferCertificate),
      paymentReceipt: createFileObject(uploadedFiles.paymentReceipt),
      faydaId: createFileObject(uploadedFiles.faydaId),
      ParentPhoto: createFileObject(uploadedFiles.ParentPhoto),
      clearance: createFileObject(uploadedFiles.clearance),
      
      // Status
      status: 'pending',
      paymentVerified: false
    };

    // ✅ DEBUG: Log what we're about to save
    console.log('📦 Admission data ready for save:');
    console.log('   Photo exists:', !!admissionData.photo);
    console.log('   Photo secure_url:', admissionData.photo?.secure_url ? 'YES' : 'NO');
    console.log('   Birth cert exists:', !!admissionData.birthCertificate);
    console.log('   Transcript exists:', !!admissionData.transcript);
    console.log('  studentId exists:', !!admissionData.studentId);

    const admission = new Admission(admissionData);
    const savedAdmission = await admission.save();  
    
    console.log(`✅ Admission saved successfully: ${savedAdmission._id}`);
    console.log(`📁 Student folder: ${savedAdmission.studentFolder}`);

    // 7. Send success response
    res.status(201).json({
      success: true,
      message: 'Admission submitted successfully',
      data: {
        admissionId: savedAdmission._id,
        studentId: savedAdmission.studentId,
        fullName: `${savedAdmission.firstName} ${savedAdmission.lastName}`,
        grade: savedAdmission.applyingGrade,
        studentFolder: savedAdmission.studentFolder,
        files: {
          photo: savedAdmission.photo ? '✓ Uploaded' : '✗ Failed',
          birthCertificate: savedAdmission.birthCertificate ? '✓ Uploaded' : '✗ Failed',
          transcript: savedAdmission.transcript ? '✓ Uploaded' : '✗ Failed',
          transferCertificate: savedAdmission.transferCertificate ? '✓ Uploaded' : 'Not provided',
          paymentReceipt: savedAdmission.paymentReceipt ? '✓ Uploaded' : 'Not provided',
          faydaId: savedAdmission.faydaId ? '✓ Uploaded' : 'Not provided',
          ParentPhoto: savedAdmission.ParentPhoto ? '✓ Uploaded' : 'Not provided',
          clearance: savedAdmission.clearance ? '✓ Uploaded' : 'Not provided'
        },
        status: savedAdmission.status,
        createdAt: savedAdmission.createdAt
      }
    });
 
    // this name of this name of this name of this name of this name of this name of this name of this name of this of this name of this 

  } catch (error) {
    console.error('\n❌ FINAL ERROR:', error.message);
    
    // Mongoose validation error
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', error.errors);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',  
        message: Object.values(error.errors).map(err => {
          return `${err.path}: ${err.message}`;
        }).join(', ')
      });
    }
    
    // Cloudinary error
    if (error.message.includes('Cloudinary') || error.message.includes('upload')) {
      return res.status(500).json({
        success: false,
        error: 'File storage error',
        message: 'Failed to store files. Please try again with different files.',
        details: error.message
      });
    }
    
    // General error
    res.status(500).json({
      success: false,
      error: 'Failed to submit admission',
      message: error.message,
      ...(process.env.APP_ENV === 'development' && { stack: error.stack })
    });
  }
};

// Get single admission
export const getAdmission = async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id);
    
    if (!admission) {
      return res.status(404).json({
        success: false,
        error: 'Admission not found'
      });
    }
    
    res.json({
      success: true,
      data: admission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all admissions
export const getAllAdmissions = async (req, res) => {
  try {
    const admissions = await Admission.find()
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: admissions.length,
      data: admissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update admission status
export const updateAdmissionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'reviewed', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: 'Status must be: pending, reviewed, accepted, rejected'
      });
    }
    
    const admission = await Admission.findByIdAndUpdate(
      req.params.id,
      { status: status },
      { new: true }
    );
    
    if (!admission) {
      return res.status(404).json({
        success: false,
        error: 'Admission not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Status updated',
      data: admission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete admission
export const deleteAdmission = async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id);
    
    if (!admission) {
      return res.status(404).json({
        success: false,
        error: 'Admission not found'
      });
    }
    
    // Try to delete folder from Cloudinary
    try {
      await deleteStudentFolder(
        admission.applyingGrade,
        admission.firstName,
        admission.lastName,
        admission.studentId
      );
    } catch (folderError) {
      console.warn('⚠️ Could not delete folder:', folderError.message);
    }
    
    await admission.deleteOne();
    
    res.json({
      success: true,
      message: 'Admission deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get student documents
export const getStudentDocuments = async (req, res) => {
  try {
    const studentId = req.params.id;
    
    // Get student from database
    const student = await Admission.findById(studentId);
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }
    
    // Collect all documents
    const documents = [];
    
    // Helper function to add document
    const addDocument = (field, type, fileObject) => {
      if (fileObject && fileObject.secure_url) {
        documents.push({
          type: type,
          filename: fileObject.original_name || `${type}_${student.studentId}`,
          url: fileObject.secure_url,
          size: fileObject.size || 0,
          uploadedAt: student.createdAt,
          field: field
        });
      }
    };
    
    // Add all documents
    addDocument('Studentphoto', 'Studentphoto', student.photo);
    addDocument('Certificate Front', 'Certificate Front', student.birthCertificate);
    addDocument('Certificate Back', 'Certificate Back', student.transcript);
    addDocument('Parent ID (Woreda Or Fayda Nu)', 'Parent ID (Woreda Or Fayda Nu)', student.transferCertificate);
    addDocument('paymentReceipt', 'payment receipt', student.paymentReceipt);
    addDocument('Student National ID Front', 'Student National ID Front', student.faydaId);
    addDocument('ParentPhoto', 'parentphoto', student.ParentPhoto);
    addDocument('clearance', 'clearance', student.clearance);
    
    res.json({
      success: true,
      studentName: `${student.firstName} ${student.lastName}`,
      studentId: student.studentId,
      folder: student.studentFolder,
      totalDocuments: documents.length,
      documents: documents
    });
    
  } catch (error) {
    console.error('❌ Error getting documents:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Download all documents as ZIP
export const downloadAllDocuments = async (req, res) => {
  try {
    const studentId = req.params.id;
    const student = await Admission.findById(studentId);
    
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }
    
    const zip = new JSZip();
    
    // Helper function to add file to ZIP
    const addFileToZip = async (fileObject, fileName) => {
      if (!fileObject || !fileObject.secure_url) return false;
      
      try {
        // Since we're using Cloudinary, we need to download the file first
        const response = await fetch(fileObject.secure_url);
        if (!response.ok) {
          console.error(`Failed to fetch ${fileName}: ${response.status}`);
          return false;
        }
        
        const buffer = await response.arrayBuffer();
        zip.file(fileName, buffer);
        return true;
      } catch (error) {
        console.error(`Error adding ${fileName} to ZIP:`, error.message);
        return false;
      }
    };
    
    // Add all files to ZIP
    const filesAdded = await Promise.all([
      addFileToZip(student.photo, `student_photo_${student.studentId}.${getFileExtension(student.photo)}`),
      addFileToZip(student.birthCertificate, `birth_certificate_${student.studentId}.${getFileExtension(student.birthCertificate)}`),
      addFileToZip(student.transcript, `transcript_${student.studentId}.${getFileExtension(student.transcript)}`),
      addFileToZip(student.paymentReceipt, `payment_receipt_${student.studentId}.${getFileExtension(student.paymentReceipt)}`),
      addFileToZip(student.transferCertificate, `transfer_certificate_${student.studentId}.${getFileExtension(student.transferCertificate)}`),
      addFileToZip(student.faydaId, `fayda_id_${student.studentId}.${getFileExtension(student.faydaId)}`),
      addFileToZip(student.ParentPhoto, `parent_photo_${student.studentId}.${getFileExtension(student.ParentPhoto)}`),
      addFileToZip(student.clearance, `clearance_${student.studentId}.${getFileExtension(student.clearance)}`)
    ]);
    
    // Check if any files were added
    if (filesAdded.every(added => !added)) {
      return res.status(404).json({
        success: false,
        message: 'No documents found for this student'
      });
    }
    
    // Generate ZIP file
    const zipData = await zip.generateAsync({ type: 'nodebuffer' });
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${student.firstName}_${student.lastName}_documents.zip"`);
    
    // Send the ZIP file
    res.send(zipData);
    
  } catch (error) {
    console.error('❌ Error downloading documents:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Helper function to get file extension
const getFileExtension = (fileObject) => {
  if (!fileObject || !fileObject.original_name) return 'jpg';
  
  const name = fileObject.original_name;
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : 'jpg';
};

// Get admission statistics
export const getAdmissionStats = async (req, res) => {
  try {
    const total = await Admission.countDocuments();
    const pending = await Admission.countDocuments({ status: 'pending' });
    const reviewed = await Admission.countDocuments({ status: 'reviewed' });
    const accepted = await Admission.countDocuments({ status: 'accepted' });
    const rejected = await Admission.countDocuments({ status: 'rejected' });
    
    // Get by grade
    const byGrade = await Admission.aggregate([
      {
        $group: {
          _id: '$applyingGrade',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          grade: '$_id',
          count: 1,
          _id: 0
        }
      },
      { $sort: { grade: 1 } }
    ]);
    
    // Convert array to object
    const byGradeObj = {};
    byGrade.forEach(item => {
      byGradeObj[item.grade] = item.count;    
    });
    
    res.json({
      success: true,
      stats: {
        total,
        pending,
        reviewed,
        accepted,
        rejected,
        byGrade: byGradeObj
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};