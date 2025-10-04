import dotenv from 'dotenv';
dotenv.config(); 

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import schoolRoutes from './routes/SchoolRoute.js'
import sportRoutes from './routes/SportRouter.js'
import counsleRoute from './routes/CounsleRoute.js'
import router from './routes/RouteUser.js';

const PORT = process.env.PORT || 5000; 
const app = express();  

app.use(express.json());   

// Fixed CORS configuration
app.use(cors({
  origin: ["http://localhost:3000", "https://tuludimtuschool.vercel.app"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"], 
  credentials: true
}));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Mongo is connected successfully!'))
  .catch((err) => console.error('❌ Mongo connection failed!', err));

// 🔥 ADD THESE HEALTH CHECK ROUTES
app.get('/api/users/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Users API is healthy',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

app.get('/api/users/test', (req, res) => {
  res.status(200).json({ 
    message: 'Users test endpoint is working!',
    success: true,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Backend server is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

app.get('/api/test', (req, res) => {
  res.status(200).json({ 
    message: 'Backend test endpoint is working!',
    success: true,
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Tullu Dimtu School Backend Server',
    status: 'Running',
    timestamp: new Date().toISOString(),
    endpoints: {
      users: '/api/users',
      health: '/api/health',
      test: '/api/test'
    }
  });
});

// Your existing routes
app.use('/api', schoolRoutes);
app.use('/api', sportRoutes);
app.use('/api/concerns', counsleRoute);
app.use('/api/users', router);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port: ${PORT}`);
});
