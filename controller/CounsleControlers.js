import Concern from "../models/Councle.js";


export const createConcern = async (req, res) => {
  try {
    const { name, studentId, concern, urgency = "medium", details } = req.body;

    if (!name || !studentId || !concern) {
      return res.status(400).json({ message: "name, studentId, and concern are required" });
    }

    const newConcern = await Concern.create({ name, studentId, concern, urgency, details });
    res.status(201).json(newConcern);
  } catch (error) {
    res.status(500).json({ message: "Error creating concern", error });
  }
};

// Get all concerns
export const getConcerns = async (req, res) => {
  try {
    const concerns = await Concern.find();
    res.json(concerns);
  } catch (error) {
    res.status(500).json({ message: "Error fetching concerns", error });
  }
};
