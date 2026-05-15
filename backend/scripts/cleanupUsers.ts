import mongoose from 'mongoose';
import { User } from '../src/models/User';
import { Subscription } from '../src/models/Subscription';
import { UserProfile } from '../src/models/UserProfile';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function cleanupUsers(emails: string[]) {
  try {
    // Explicitly use notifyx since users were found there
    const uri = 'mongodb://localhost:27017/notifyx';
    await mongoose.connect(uri);
    console.log(`Connected to MongoDB: ${uri}`);

    for (const email of emails) {
      console.log(`\n--- Cleaning up: ${email} ---`);
      
      const user = await User.findOne({ email });
      if (!user) {
        console.log(`User ${email} not found.`);
        continue;
      }

      const userId = user._id;

      // 1. Delete Subscriptions
      const subResult = await Subscription.deleteMany({ userId });
      console.log(`Deleted ${subResult.deletedCount} subscriptions.`);

      // 2. Delete User Profile
      const profileResult = await UserProfile.deleteMany({ userId });
      console.log(`Deleted ${profileResult.deletedCount} user profiles.`);

      // 3. Delete User
      const userResult = await User.deleteOne({ _id: userId });
      console.log(`Deleted user account: ${userResult.deletedCount}`);
    }

    console.log('\nCleanup complete.');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

const targetEmails = ['agent649@gmail.com', 'agentic649@gmail.com', 'saurabhsingh881888@gmail.com'];
cleanupUsers(targetEmails);
