import { createUser } from "../controller/UserForm.js";
import express from "express";

const router = express.Router();
router.post("/submit", createUser);

export default router;