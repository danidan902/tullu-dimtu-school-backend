
import dotenv from 'dotenv';
dotenv.config(); 
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose'; 
import schoolRoutes from './routes/SchoolRoute.js';
import sportRoutes from './routes/SportRouter.js';
import counsleRoute from './routes/CounsleRoute.js';
import router from './routes/RouteUser.js';
import teacherRoutes from "./routes/teacherRoutes.js";
import fileRoutes from './routes/fileRoutes.js';
import twilio from "twilio";
import { Server } from 'socket.io';
import { createServer } from 'http';
import materialRoutes from './routes/materials.js';
import uploadRoutes from './routes/uploads.js';
import visitRoutes from './routes/visitorRoutes.js'
import registrationRoutes from './routes/registrationRoutes.js';
import admissionRoutes from './routes/admissionRoutes.js'
import cloudinary  from 'cloudinary'

import postRoutes from './routes/posts.js'
import authRoutes from './routes/authRoutes.js'
import emailRoutes from './routes/LibraryRoute.js'
import techEmailRoute from './routes/TeacherRouteEmail.js'
import uploadRoute from './routes/UploadsTeacherA.js';
import adminRoute from './routes/adminRoute.js'

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
const twilioClient = twilio(accountSid, authToken);


const PORT = process.env.PORT || 5000; 
const app = express();  
const server = createServer(app);


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// app.use(bodyParser.json());



// Create Socket.io server for real-time
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// CORS configuration
app.use(cors({
  origin: ["http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS",'PATCH',],
  allowedHeaders: ["Content-Type", "Authorization"], 
  credentials: true
}));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Mongo is connected successfully!'))
  .catch((err) => console.error('❌ Mongo connection failed!', err));


// mongoose.connect(process.env.MONGODB_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// })
// .then(() => console.log('✅ Mongo is connected successfully!'))
// .catch((err) => console.error('❌ Mongo connection failed!', err));


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
app.use('/api/posts', postRoutes);
app.use('/api/auth', authRoutes);
app.use("/api/auths", emailRoutes);
app.use("/api/techs", techEmailRoute)
app.use('/api/upload', uploadRoute);
app.use('/api/admin', adminRoute);



app.use('/api/files', fileRoutes);
app.use("/api/teachers", teacherRoutes);



app.use('/api/materials', materialRoutes);
app.use('/api/uploads', uploadRoutes);

let announcements = [];


const userReadStatus = new Map(); 


io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  

  if (userId && !userReadStatus.has(userId)) userReadStatus.set(userId, []);


  const annsWithStatus = announcements.map(a => ({
    ...a,
    readByThisUser: userReadStatus.get(userId)?.includes(a.id) || false
  }));

  socket.emit('initial-announcements', annsWithStatus);

 
  socket.on('mark-as-read', ({ announcementId }) => {
    if (!userId) return;
    const read = userReadStatus.get(userId) || [];
    if (!read.includes(announcementId)) {
      read.push(announcementId);
      userReadStatus.set(userId, read);
      socket.emit('update-unread-count', read.length);
    }
  });

  socket.on('disconnect', () => console.log('Client disconnected', socket.id));
});



app.post("/api/announcements", (req, res) => {
  const { title, message, priority = 'normal', from = 'School Director' } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required' });
  }

  const countdownDuration = 10 * 60 * 1000; 
  const newAnn = {
    id: Date.now().toString(),
    title,
    message,
    createdAt: new Date().toISOString(),
    countdownEndTime: new Date(Date.now() + countdownDuration).toISOString(),
    priority,
    from,
    category: req.body.category || 'General'
  };

  announcements.unshift(newAnn);

  // Broadcast to all clients
  io.emit('new-announcement', newAnn);

  res.json({ success: true, announcement: newAnn });
});



app.get("/api/announcements", (req, res) => {
  console.log('📋 Sending announcements:', announcements.length);
  res.json(announcements);
});


app.get("/api/announcements/unread-count/:userId", (req, res) => {
  const userId = req.params.userId;
  
  if (!userReadStatus.has(userId)) {
    userReadStatus.set(userId, []);
  }
  
  const unreadCount = announcements.filter(ann => 
    !userReadStatus.get(userId).includes(ann.id)
  ).length;
  
  res.json({ unreadCount });
});


app.post("/api/announcements/:id/read", (req, res) => {
  const announcementId = req.params.id;
  const { userId } = req.body;            
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  

  if (!userReadStatus.has(userId)) {
    userReadStatus.set(userId, []);
  }
  
  const userRead = userReadStatus.get(userId);
  if (!userRead.includes(announcementId)) {
    userRead.push(announcementId);
    userReadStatus.set(userId, userRead);
    
 
    io.emit('announcement-read', { announcementId, userId });
    
    console.log(`✅ Announcement ${announcementId} marked as read by user ${userId}`);
  }
  
  res.json({ success: true });
});


app.post("/api/announcements/mark-all-read", (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  
 
  const allAnnouncementIds = announcements.map(ann => ann.id);
  userReadStatus.set(userId, allAnnouncementIds);
  
  console.log(`✅ All announcements marked as read for user ${userId}`);
  
  res.json({ success: true, message: 'All announcements marked as read' });
});


app.get("/api/announcements/read-status/:announcementId", (req, res) => {
  const announcementId = req.params.announcementId;
  const usersWhoRead = [];
  

  for (const [userId, readAnnouncements] of userReadStatus.entries()) {
    if (readAnnouncements.includes(announcementId)) {
      usersWhoRead.push(userId);
    }
  }
  
  res.json({ 
    announcementId, 
    totalRead: usersWhoRead.length,
    users: usersWhoRead 
  });
});


app.delete("/api/announcements/:id", (req, res) => {
  const id = req.params.id;
  const index = announcements.findIndex(ann => ann.id === id);
  
  if (index !== -1) {
    announcements.splice(index, 1);
    
 
    for (const [userId, readAnnouncements] of userReadStatus.entries()) {
      const filtered = readAnnouncements.filter(annId => annId !== id);
      userReadStatus.set(userId, filtered);
    }
    
    io.emit('announcement-deleted', id);
    res.json({ success: true, message: 'Announcement deleted' });
  } else {
    res.status(404).json({ success: false, message: 'Announcement not found' });
  }
});


app.delete("/api/announcements", (req, res) => {
  announcements = [];
  userReadStatus.clear();
  io.emit('announcements-cleared');
  res.json({ success: true, message: 'All announcements cleared' });
});



app.post("/api/send-verification", async (req, res) => {
  const { phone } = req.body;
  try {
    const verification = await twilioClient.verify
      .services(verifyServiceSid)
      .verifications.create({ to: phone, channel: "sms" });
    res.json({ success: true, status: verification.status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


app.post("/api/check-verification", async (req, res) => {
  const { phone, code } = req.body;
  try {
    const verificationCheck = await twilioClient.verify
      .services(verifyServiceSid)
      .verificationChecks.create({ to: phone, code });

    if (verificationCheck.status === "approved") {
      res.json({ success: true, message: "Phone verified!" });
    } else {
      res.status(400).json({ success: false, error: "Invalid code" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


app.get("/api/announcements/stats", (req, res) => {
  const stats = {
    totalAnnouncements: announcements.length,
    totalUsers: userReadStatus.size,
    readStatistics: {}
  };
  
 
  for (const announcement of announcements) {
    let readCount = 0;
    for (const readAnnouncements of userReadStatus.values()) {
      if (readAnnouncements.includes(announcement.id)) {
        readCount++;
      }
    }
    
    stats.readStatistics[announcement.id] = {
      title: announcement.title,
      readCount,
      totalUsers: userReadStatus.size,
      readPercentage: userReadStatus.size > 0 ? 
        Math.round((readCount / userReadStatus.size) * 100) : 0
    };
  }
  
  res.json(stats);
});


app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    announcements: announcements.length,
    connectedUsers: userReadStatus.size,
    timestamp: new Date().toISOString()
  });
});



app.use('/api/visits', visitRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/admissions', admissionRoutes);
app.use('/api/posts', postRoutes);



// Health check routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'TulluDimtu School Admission API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});




app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  
  res.json({
    success: true,
    server: 'running',
    database: statusMap[dbStatus],
    cloudinary: process.env.CLOUDINARY_CLOUD_NAME ? 'configured' : 'not configured',
    timestamp: new Date().toISOString()
  });
});



app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.url}`
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('🔥 ERROR:', err.message);
  
  res.status(err.status || 500).json({
    success: false,
    error: 'Something went wrong!',
    message: err.message,
    ...(process.env.APP_ENV === 'development' && { stack: err.stack })
  });
});


// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port: http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready for real-time announcements`);
  console.log(`👤 User-specific notification tracking enabled`);
  console.log(`📊 Announcements API: POST http://localhost:${PORT}/api/announcements`);
    console.log(`   MongoDB URI: ${process.env.MONGODB_URI ? 'Configured' : 'Missing'}`);
  console.log(`   Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? 'Configured' : 'Missing'}`);
  console.log(`   App Name: ${process.env.APP_NAME || 'Not set'}`);
   console.log(`👥 Authors API: http://localhost:${PORT}/api/authors`);
    console.log(`📰 News API: http://localhost:${PORT}/api/news`);

  console.log('=== ENVIRONMENT CHECK ===');
console.log('EMAIL_USER exists:', !!process.env.EMAIL_USER);
console.log('EMAIL_PASS exists:', !!process.env.EMAIL_PASS);
console.log('MONGODB_URI exists:', !!process.env.MONGO_URI);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('=========================');


});







