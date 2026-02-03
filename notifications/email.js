import nodemailer from "nodemailer";

// Configure transporter
const transporter = nodemailer.createTransport({
  service: "Gmail", // Or your email provider
  auth: {
    user: "your_email@gmail.com",
    pass: "your_app_password", // Use App password if using Gmail
  },
});

// Function to send email
export const sendEmailNotification = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: '"School Notifications" <your_email@gmail.com>',
      to,
      subject,
      text,
    });
    console.log("Email sent to:", to);
  } catch (error) {
    console.error("Email error:", error);
  }
};
