import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const router = express.Router();

// User schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'student' }
});

// Hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Prevent model re-declare error
const User =
  mongoose.models.UserDigital ||
  mongoose.model('UserDigital', userSchema);

// ✅ Test route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Auth API is working'
  });
});

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });

    const newUser = new User({
      name,
      email,
      password,
      role
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      },
      token: 'dummy-token'
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Signin
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({
        success: false,
        message: 'Invalid password'
      });

    res.json({
      success: true,
      message: 'Login successful',
      user,
      token: 'dummy-token'
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});





export default router;
