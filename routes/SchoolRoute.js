// import express from "express";
// import School from "../models/School.js";

// const router = express.Router(); // ✅ Define router

// // Contact form route
// router.post("/contact", async (req, res) => {
//   try {
//     const schoolContact = new School(req.body);
//     await schoolContact.save();
//     res.status(201).json({ message: "Thank you for your message!" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// export default router;



import express from "express";
import School from "../models/School.js";

const router = express.Router();

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

// Dashboard route - Fetch all contacts
router.get("/dashboard", async (req, res) => {
  try {
    const contacts = await School.find().sort({ createdAt: -1 });
    res.status(200).json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Optional: Get single contact
router.get("/dashboard/:id", async (req, res) => {
  try {
    const contact = await School.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }
    res.status(200).json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add this DELETE route to your existing router
router.delete("/:id", async (req, res) => {
  try {
    const deletedContact = await School.findByIdAndDelete(req.params.id);
    if (!deletedContact) {
      return res.status(404).json({ error: "Contact not found" });
    }
    res.status(200).json({ message: "Contact deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;