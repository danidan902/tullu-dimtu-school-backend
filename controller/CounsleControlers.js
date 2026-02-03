import Concern from "../models/Councle.js";

// Create concern
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
    const concerns = await Concern.find().sort({ createdAt: -1 });
    res.json(concerns);
  } catch (error) {
    res.status(500).json({ message: "Error fetching concerns", error });
  }
};

// Get single concern
export const getConcernById = async (req, res) => {
  try {
    const concern = await Concern.findById(req.params.id);
    if (!concern) {
      return res.status(404).json({ message: "Concern not found" });
    }
    res.json(concern);
  } catch (error) {
    res.status(500).json({ message: "Error fetching concern", error });
  }
};

// Delete concern
export const deleteConcern = async (req, res) => {
  try {
    const deletedConcern = await Concern.findByIdAndDelete(req.params.id);
    if (!deletedConcern) {
      return res.status(404).json({ message: "Concern not found" });
    }
    res.json({ message: "Concern deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting concern", error });
  }
};

// Update concern
export const updateConcern = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const updatedConcern = await Concern.findByIdAndUpdate(
      req.params.id,
      { status, notes, updatedAt: new Date() },
      { new: true }
    );
    if (!updatedConcern) {
      return res.status(404).json({ message: "Concern not found" });
    }
    res.json(updatedConcern);
  } catch (error) {
    res.status(500).json({ message: "Error updating concern", error });
  }
};

// Get stats
export const getConcernStats = async (req, res) => {
  try {
    const total = await Concern.countDocuments();
    const highUrgency = await Concern.countDocuments({ urgency: 'high' });
    const mediumUrgency = await Concern.countDocuments({ urgency: 'medium' });
    const lowUrgency = await Concern.countDocuments({ urgency: 'low' });
    
    res.json({
      total,
      highUrgency,
      mediumUrgency,
      lowUrgency
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching stats", error });
  }
};