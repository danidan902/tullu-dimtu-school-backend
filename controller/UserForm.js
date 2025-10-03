import User from "../models/UserSchool.js";

export const createUser = async (req, res) => {
  try {
    console.log('📥 Received request body:', req.body);
    
    const { name, email, password } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      console.log('❌ Missing required fields:', { name, email, password });
      return res.status(400).json({
        error: "All fields are required: name, email, password"
      });
    }

    console.log('💾 Creating new user...');
    const newUser = new User({ 
      name, 
      email, 
      password
    });
    
    await newUser.save();
    
    console.log('✅ User saved successfully:', newUser._id);

    res.status(201).json({
      message: "User submitted successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    }); 
  } catch (err) {         
    console.error("❌ Error creating user:", err); 
    
    // Handle specific MongoDB errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: "Validation error: " + err.message
      });
    }
    
    if (err.code === 11000) {
      return res.status(400).json({
        error: "Email already exists",
        details: "This email is already registered. Please use a different email address."
      });
    }
    
    res.status(500).json({
      error: "Server error, could not create user: " + err.message
    });
  }
};