import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/careerx-testing';

async function deleteUsers() {
  try {
    console.log(`Connecting to MongoDB: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to database.');

    const User = mongoose.connection.collection('users');
    const UserProfile = mongoose.connection.collection('userprofiles');
    const Subscription = mongoose.connection.collection('subscriptions');

    const emailsToDelete = [
      'priyanshworks21@gmail.com', 
      'priyansh.anydayjob@gmail.com'
    ];
    
    console.log(`Looking for users: ${emailsToDelete.join(', ')}`);

    // Find the users first to get their ObjectIds
    const users = await User.find({ email: { $in: emailsToDelete } }).toArray();
    
    if (users.length === 0) {
      console.log('No users found with those email addresses.');
    } else {
      const userIds = users.map(u => u._id);
      console.log(`Found ${users.length} user(s). Deleting...`);

      // Delete the users
      const userResult = await User.deleteMany({ email: { $in: emailsToDelete } });
      console.log(`✅ Deleted ${userResult.deletedCount} user record(s).`);

      // Delete associated profiles
      const profileResult = await UserProfile.deleteMany({ userId: { $in: userIds } });
      console.log(`✅ Deleted ${profileResult.deletedCount} associated user profile(s).`);
      
      // Delete associated subscriptions
      const subResult = await Subscription.deleteMany({ userId: { $in: userIds } });
      console.log(`✅ Deleted ${subResult.deletedCount} associated subscription(s).`);
    }

  } catch (error) {
    console.error('❌ Error during deletion:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
    process.exit(0);
  }
}

deleteUsers();
