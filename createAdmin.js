import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from './models/Admin.js';

dotenv.config();


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const createAdmins = async () => {
  try {


    const admin1 = new Admin({
      email: 'badasawadajo@gmail.com',
      password: 'badasa@1234',
      name: 'Director Badasa',
      role: 'director'
    });


    const admin2 = new Admin({
      email: 'danidan@gmail.com',
      password: 'dani1234',
      name: 'Student',
      role: 'student'
    });

     const admin3 = new Admin({
      email: 'teachers@gmail.com',
      password: 'teach@1234',
      name: 'teacher',
      role: 'teacher'
    });

  
    await admin1.save();
    await admin2.save();
    await admin3.save();

    console.log('Two users created successfully ✅');
    mongoose.disconnect();

  } catch (err) {
    console.error('Error creating users:', err);
    mongoose.disconnect();
  }
};

createAdmins();
