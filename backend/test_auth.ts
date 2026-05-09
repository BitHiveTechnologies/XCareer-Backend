import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { User } from './src/models/User';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/notifyx';

async function testAuth() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    const email = 'test_auth_123@example.com';
    const plainPassword = 'Password123!';

    // Delete if exists
    await User.deleteOne({ email });

    // 1. Create a user exactly like paymentController does
    console.log(`Creating user with password: ${plainPassword}`);
    
    // Simulate what we updated paymentController to do:
    const user = new User({
      email,
      name: 'Test User',
      password: plainPassword,
      role: 'user',
      mustChangePassword: true
    });

    await user.save();
    console.log(`User created. Stored hash: ${user.password}`);

    // 2. Simulate login exactly like authController does
    const fetchedUser = await User.findOne({ email }).select('+password');
    if (!fetchedUser) {
      console.log('User not found!');
      return;
    }
    
    console.log(`Fetched user hash: ${fetchedUser.password}`);

    const isMatch = await bcrypt.compare(plainPassword, fetchedUser.password);
    console.log(`Password match result: ${isMatch}`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
    process.exit(0);
  }
}

testAuth();
