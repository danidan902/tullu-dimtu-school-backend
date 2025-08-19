import express from "express";
import School from "../models/School.js";

const router = express.Router(); // ✅ Define router

// Contact form route
router.post("/contact", async (req, res) => {
  try {
    const schoolContact = new School(req.body);
    await schoolContact.save();
    res.status(201).json({ message: "Thank you for your message!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
