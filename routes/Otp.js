import express from 'express';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config(); 
const router = express.Router();

// User schema for email-only authentication
const emailAuthSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    otp: String,
    otpExpires: Date,
    isVerified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: Date
});

const EmailAuth = mongoose.models.EmailAuth || mongoose.model('EmailAuth', emailAuthSchema);

// Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Generate 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email
async function sendOTPEmail(email, otp) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP Verification Code',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>OTP Verification</h2>
                <p>Use the following OTP to verify your email:</p>
                <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
                    <h1 style="color: #333; letter-spacing: 5px;">${otp}</h1>
                </div>
                <p>This OTP will expire in 10 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
            </div>    
        `
    };

    await transporter.sendMail(mailOptions);
}

// 1. Request OTP (Login/Register)
router.post('/request-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email is required' 
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Find or create user
        let user = await EmailAuth.findOne({ email });
        
        if (user) {
            // Update existing user with new OTP
            user.otp = otp;
            user.otpExpires = otpExpires;
            user.isVerified = false;
        } else {
            // Create new user
            user = new EmailAuth({
                email,
                otp,
                otpExpires
            });
        }

        await user.save();

        // Send OTP email
        await sendOTPEmail(email, otp);

        res.json({
            success: true,
            message: 'OTP sent to your email',
            email: email
        });

    } catch (error) {
        console.error('Request OTP error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// 2. Verify OTP
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and OTP are required' 
            });
        }

        const user = await EmailAuth.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Email not found. Please request OTP first.' 
            });
        }

        // Check if OTP matches
        if (user.otp !== otp) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid OTP' 
            });
        }

        // Check if OTP expired
        if (user.otpExpires < new Date()) {
            return res.status(400).json({ 
                success: false, 
                message: 'OTP has expired. Please request a new one.' 
            });
        }

        // Update user as verified
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user._id, 
                email: user.email 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'OTP verified successfully!',
            token,
            user: {
                id: user._id,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// 3. Resend OTP
router.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email is required' 
            });
        }

        const user = await EmailAuth.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Email not found' 
            });
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        // Update user with new OTP
        user.otp = otp;
        user.otpExpires = otpExpires;
        user.isVerified = false;
        await user.save();

        // Send new OTP email
        await sendOTPEmail(email, otp);

        res.json({
            success: true,
            message: 'New OTP sent to your email'
        });

    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// 4. Check if email exists
router.post('/check-email', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email is required' 
            });
        }

        const user = await EmailAuth.findOne({ email });
        
        res.json({
            success: true,
            exists: !!user
        });

    } catch (error) {
        console.error('Check email error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// 5. Logout (optional - client-side token removal)
router.post('/logout', async (req, res) => {
    try {
        // Note: For stateless JWT, logout is handled client-side
        // by removing the token from storage
        
        res.json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// 6. Protected route example (requires token)
router.get('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await EmailAuth.findById(decoded.userId).select('-otp -otpExpires');
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                isVerified: user.isVerified,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin
            }
        });

    } catch (error) {
        console.error('Profile error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token' 
            });
        }
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

export default router;