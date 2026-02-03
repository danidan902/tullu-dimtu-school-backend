import express from 'express';
import User from '../models/User.js';

const router = express.Router();


router.post('/users', async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.status(200).json({ message: 'Successfully registered!' });
    } catch (err) {
        
        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            return res.status(400).json({ error: `${field} already exists.` });
        }

       
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ error: errors });
        }

        res.status(500).json({ error: err.message });
    }
});

export default router;
