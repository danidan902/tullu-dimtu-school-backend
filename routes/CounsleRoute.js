import express from "express";
import { createConcern, getConcerns } from "../controller/CounsleControlers.js";

const router = express.Router();

router.post("/", createConcern);
router.get("/", getConcerns);

export default router;
