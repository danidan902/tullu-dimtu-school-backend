import express from 'express';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import Admission from '../models/Admission.js';

const router = express.Router();

// Export students data
router.post('/export', async (req, res) => {
  try {
    const { studentIds, format = 'pdf' } = req.body;
    
    // If no specific IDs provided, get all
    const query = studentIds && studentIds.length > 0 
      ? { _id: { $in: studentIds } }
      : {};
    
    const students = await Admission.find(query)
      .populate('assignedTeacher', 'name email subject')
      .sort({ createdAt: -1 });
    
    if (students.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No students found' 
      });
    }
    
    // Generate based on format
    switch (format.toLowerCase()) {
      case 'pdf':
        await generatePDF(students, res);
        break;
      case 'csv':
        await generateCSV(students, res);
        break;
      case 'excel':
        await generateExcel(students, res);
        break;
      default:
        res.status(400).json({ 
          success: false, 
          message: 'Invalid format. Use pdf, csv, or excel' 
        });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Export failed', 
      error: error.message 
    });
  }
});

// Generate PDF
async function generatePDF(students, res) {
  const doc = new PDFDocument({ margin: 50 });
  
  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=students-report.pdf');
  
  doc.pipe(res);
  
  // Header
  doc.fontSize(20).text('Student Admissions Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
  doc.fontSize(10).text(`Total Students: ${students.length}`, { align: 'center' });
  doc.moveDown(2);
  
  // Table header
  const tableTop = doc.y;
  const tableLeft = 50;
  const columnWidth = 100;
  
  // Draw table headers
  doc.fontSize(10).font('Helvetica-Bold');
  doc.text('ID', tableLeft, tableTop);
  doc.text('Name', tableLeft + columnWidth, tableTop);
  doc.text('Grade', tableLeft + columnWidth * 2, tableTop);
  doc.text('Status', tableLeft + columnWidth * 3, tableTop);
  doc.text('Contact', tableLeft + columnWidth * 4, tableTop);
  
  doc.moveTo(tableLeft, tableTop + 15)
     .lineTo(tableLeft + columnWidth * 5, tableTop + 15)
     .stroke();
  
  // Student rows
  let y = tableTop + 25;
  doc.font('Helvetica');
  
  students.forEach((student, index) => {
    if (y > 700) { // New page if needed
      doc.addPage();
      y = 50;
    }
    
    doc.fontSize(8);
    doc.text(student.studentId || student.admissionId || 'N/A', tableLeft, y);
    doc.text(`${student.firstName} ${student.lastName}`, tableLeft + columnWidth, y);
    doc.text(student.applyingGrade || 'N/A', tableLeft + columnWidth * 2, y);
    doc.text(student.status || 'pending', tableLeft + columnWidth * 3, y);
    doc.text(student.parentPhone || 'N/A', tableLeft + columnWidth * 4, y);
    
    y += 20;
  });
  
  doc.end();
}

// Generate CSV
async function generateCSV(students, res) {
  const headers = [
    'Student ID',
    'First Name',
    'Last Name',
    'Grade',
    'Age',
    'Gender',
    'Status',
    'Parent Name',
    'Parent Phone',
    'Parent Email',
    'Address',
    'Applied Date'
  ];
  
  const rows = students.map(student => [
    student.studentId || student.admissionId || '',
    student.firstName || '',
    student.lastName || '',
    student.applyingGrade || '',
    student.age || '',
    student.gender || '',
    student.status || '',
    student.parentName || '',
    student.parentPhone || '',
    student.parentEmail || '',
    student.address || '',
    new Date(student.createdAt).toLocaleDateString()
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=students-data.csv');
  res.send(csvContent);
}

// Generate Excel
async function generateExcel(students, res) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Students');
  
  // Add headers
  worksheet.columns = [
    { header: 'Student ID', key: 'id', width: 15 },
    { header: 'First Name', key: 'firstName', width: 15 },
    { header: 'Last Name', key: 'lastName', width: 15 },
    { header: 'Grade', key: 'grade', width: 10 },
    { header: 'Age', key: 'age', width: 8 },
    { header: 'Gender', key: 'gender', width: 10 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Parent Name', key: 'parentName', width: 20 },
    { header: 'Parent Phone', key: 'parentPhone', width: 15 },
    { header: 'Parent Email', key: 'parentEmail', width: 25 },
    { header: 'Address', key: 'address', width: 30 },
    { header: 'Applied Date', key: 'appliedDate', width: 15 },
    { header: 'Teacher', key: 'teacher', width: 20 }
  ];
  
  // Add rows
  students.forEach(student => {
    worksheet.addRow({
      id: student.studentId || student.admissionId || '',
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      grade: student.applyingGrade || '',
      age: student.age || '',
      gender: student.gender || '',
      status: student.status || '',
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || '',
      parentEmail: student.parentEmail || '',
      address: student.address || '',
      appliedDate: new Date(student.createdAt).toLocaleDateString(),
      teacher: student.assignedTeacher?.name || 'Not assigned'
    });
  });
  
  // Style header
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  });
  
  // Set response headers
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=students-data.xlsx'
  );
  
  await workbook.xlsx.write(res);
  res.end();
}

export default router;