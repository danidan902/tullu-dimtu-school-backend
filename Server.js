// ================== IMPORTS ==================
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";

import twilio from "twilio";
import cloudinary from "cloudinary";

// Routes
import schoolRoutes from "./routes/SchoolRoute.js";
import sportRoutes from "./routes/SportRouter.js";
import counsleRoute from "./routes/CounsleRoute.js";
import userRoutes from "./routes/RouteUser.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import materialRoutes from "./routes/materials.js";
import uploadRoutes from "./routes/uploads.js";
import visitRoutes from "./routes/visitorRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import admissionRoutes from "./routes/admissionRoutes.js";
import postRoutes from "./routes/posts.js";
import authRoutes from "./routes/authRoutes.js";
import emailRoutes from "./routes/LibraryRoute.js";
import techEmailRoute from "./routes/TeacherRouteEmail.js";
import uploadTeacherRoute from "./routes/UploadsTeacherA.js";
import adminRoute from "./routes/adminRoute.js";

// ================== BASIC SETUP ==================

const app = express();
const server = createServer(app);

const PORT = process.env.PORT || 5000;

// ================== TWILIO ==================

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

// ================== CLOUDINARY ==================

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ================== SOCKET.IO ==================

const io = new Server(server, {
  cors: {
    origin: ["https://tuludimtuschool.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ================== MIDDLEWARE ==================

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(
  cors({
    origin: ["https://tuludimtuschool.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);

// ================== MONGODB ==================

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// ================== HEALTH ROUTES ==================

app.get("/", (req, res) => {
  res.status(200).send("Server is running");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    database:
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    timestamp: new Date().toISOString(),
  });
});

// ================== ROUTES ==================

app.use("/api", schoolRoutes);
app.use("/api", sportRoutes);
app.use("/api/concerns", counsleRoute);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/auths", emailRoutes);
app.use("/api/techs", techEmailRoute);
app.use("/api/upload", uploadTeacherRoute);
app.use("/api/admin", adminRoute);

app.use("/api/files", fileRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/uploads", uploadRoutes);

app.use("/api/visits", visitRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/admissions", admissionRoutes);

// ================== ANNOUNCEMENTS (MEMORY) ==================

let announcements = [];
const userReadStatus = new Map();

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  if (userId && !userReadStatus.has(userId)) {
    userReadStatus.set(userId, []);
  }

  socket.emit("initial-announcements", announcements);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// ================== ANNOUNCEMENT APIs ==================

app.post("/api/announcements", (req, res) => {
  const { title, message } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: "Title and message required" });
  }

  const newAnn = {
    id: Date.now().toString(),
    title,
    message,
    createdAt: new Date().toISOString(),
  };

  announcements.unshift(newAnn);
  io.emit("new-announcement", newAnn);

  res.json({ success: true, announcement: newAnn });
});

app.get("/api/announcements", (req, res) => {
  res.json(announcements);
});

// ================== TWILIO OTP ==================

app.post("/api/send-verification", async (req, res) => {
  const { phone } = req.body;

  try {
    const result = await twilioClient.verify
      .services(verifyServiceSid)
      .verifications.create({
        to: phone,
        channel: "sms",
      });

    res.json({ success: true, status: result.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/check-verification", async (req, res) => {
  const { phone, code } = req.body;

  try {
    const check = await twilioClient.verify
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: phone,
        code,
      });

    if (check.status === "approved") {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Invalid code" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================== 404 ==================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

// ================== ERROR HANDLER ==================

app.use((err, req, res, next) => {
  console.error("🔥 Error:", err.message);

  res.status(500).json({
    success: false,
    error: err.message,
  });
});

// ================== SERVER ==================

server.timeout = 30000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("📡 Socket.io enabled");
  console.log("✅ Environment Loaded");
});
