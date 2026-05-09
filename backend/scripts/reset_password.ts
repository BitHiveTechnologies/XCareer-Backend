import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../src/models/User';

const MONGODB_URI = 'mongodb://localhost:27017/notifyx'; // Hardcoded to match the running backend

async function resetPassword() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    const email = 'priyanshworks21@gmail.com';
    const plainPassword = 'Password123!';

    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found!');
      return;
    }

    user.password = plainPassword;
    await user.save();
    console.log(`Password reset successfully for ${email}. New password: ${plainPassword}`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
    process.exit(0);
  }
}

resetPassword();
