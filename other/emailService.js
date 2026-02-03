import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Test email connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

export const sendVisitConfirmation = async (visitData) => {
  const { name, email, confirmationCode, visitDate, numberOfVisitors, purpose, message } = visitData;
  
  const formattedDate = new Date(visitDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const purposeLabels = {
    'prospective-student': 'Prospective Student/Parent',
    'educational-partner': 'Educational Partner',
    'research': 'Research/Academic Study',
    'community-partner': 'Community Partner',
    'other': 'Other'
  };

  const purposeText = purposeLabels[purpose] || purpose;

  const mailOptions = {
    from: {
      name: 'Tulu Dimtu School',
      address: process.env.EMAIL_FROM
    },
    to: email,
    subject: 'Visit Request Received - Tulu Dimtu School',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4f46e5, #3730a3); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4f46e5; }
          .code { font-size: 24px; font-weight: bold; color: #4f46e5; letter-spacing: 2px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Visit Request Confirmed</h1>
            <p>Tulu Dimtu School</p>
          </div>
          <div class="content">
            <p>Dear <strong>${name}</strong>,</p>
            <p>Thank you for scheduling a visit to Tulu Dimtu School. We have received your request and will contact you within 24 hours to confirm your appointment.</p>
            
            <div class="details">
              <h3>📋 Visit Details</h3>
              <p><strong>Confirmation Code:</strong></p>
              <p class="code">${confirmationCode}</p>
              <p><strong>Date:</strong> ${formattedDate}</p>
              <p><strong>Number of Visitors:</strong> ${numberOfVisitors}</p>
              <p><strong>Purpose:</strong> ${purposeText}</p>
              ${message ? `<p><strong>Additional Message:</strong><br>${message}</p>` : ''}
            </div>
            
            <h3>📍 Our Contact Information</h3>
            <ul>
              <li>📞 Phone: +251 XX XXX XXXX</li>
              <li>📧 Email: info@tuludimtuschool.edu.et</li>
              <li>🏫 Address: Tulu Dimtu, Ethiopia</li>
            </ul>
            
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>⚠️ Important:</strong> Please keep this confirmation code for reference. Our team will contact you to finalize the visit arrangements.</p>
            </div>
            
            <p>Best regards,<br><strong>The Tulu Dimtu School Team</strong></p>
            
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>If you need to modify or cancel your visit request, please contact us directly.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Dear ${name},

Thank you for scheduling a visit to Tulu Dimtu School. We have received your request and will contact you within 24 hours to confirm your appointment.

Visit Details:
Confirmation Code: ${confirmationCode}
Date: ${formattedDate}
Number of Visitors: ${numberOfVisitors}
Purpose: ${purposeText}
${message ? `Additional Message: ${message}` : ''}

Our contact information:
Phone: +251 XX XXX XXXX
Email: info@tuludimtuschool.edu.et
Address: Tulu Dimtu, Ethiopia

Best regards,
The Tulu Dimtu School Team`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Confirmation email sent to ${email}`);
    return { success: true, message: 'Confirmation email sent successfully' };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
};

export const sendAdminNotification = async (visitData) => {
  // Similar implementation for admin notifications
  // (You can expand this based on your needs)
};

export default {
  sendVisitConfirmation,
  sendAdminNotification
};