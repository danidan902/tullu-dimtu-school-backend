import express from "express";
import { uploadTeacher } from "../controller/teacherController.js";
import Teacher from "../models/Teacher.js";

const router = express.Router();

// POST: upload teacher data
router.post("/upload", uploadTeacher);


router.get('/', async (req, res) => {
  try {
    const teachers = await Teacher.find(); // Fetch all teachers from DB
    res.status(200).json(teachers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch teachers' });
  }
});

export default router;
