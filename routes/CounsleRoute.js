// routes/concernRoutes.js
import express from 'express';
import { createConcern, deleteConcern, getConcernById, getConcerns, getConcernStats, updateConcern } from '../controller/CounsleControlers.js';

const router = express.Router();

router.post('/', createConcern);
router.get('/', getConcerns);
router.get('/stats', getConcernStats);
router.get('/:id', getConcernById);
router.delete('/:id', deleteConcern);
router.put('/:id', updateConcern);

export default router;