import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/notifyx';

async function listUsers() {
  try {
    console.log(`Connecting to MongoDB: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to database.');

    const User = mongoose.connection.collection('users');
    
    const users = await User.find({}).toArray();
    console.log(`Found ${users.length} total users in DB:`);
    users.forEach(u => {
      console.log(`- ${u.email} (ID: ${u._id})`);
    });

  } catch (error) {
    console.error('❌ Error during query:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
    process.exit(0);
  }
}

listUsers();
