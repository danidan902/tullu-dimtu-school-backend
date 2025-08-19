import dotenv from 'dotenv';
dotenv.config(); 

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import schoolRoutes from './routes/SchoolRoute.js'
import sportRoutes from './routes/SportRouter.js'
import counsleRoute from './routes/CounsleRoute.js'


const PORT = process.env.PORT || 5001; 
const app = express();  

app.use(express.json());   
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Mongo is connected successfully!'))
  .catch((err) => console.error('❌ Mongo connection failed!', err));

app.use('/api', schoolRoutes);
app.use('/api', sportRoutes);
app.use('/api/concerns', counsleRoute);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port: ${PORT}`);
});
