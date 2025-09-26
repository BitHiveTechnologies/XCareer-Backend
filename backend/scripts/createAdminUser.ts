import mongoose from 'mongoose';
import { config } from '../src/config/environment';
import { User } from '../src/models/User';

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin user exists
    let adminUser = await User.findOne({ email: 'admin@notifyx.com' });
    
        if (adminUser) {
          // Update existing admin user
          adminUser.role = 'admin';
          adminUser.subscriptionStatus = 'active';
          adminUser.subscriptionPlan = 'premium';
          adminUser.name = 'Admin User';
          adminUser.mobile = '9876543210';
          // Reset password to default (will be hashed by pre-save hook)
          adminUser.password = 'Admin123!';
          await adminUser.save();
          console.log('✅ Updated existing admin user with admin role and reset password');
    } else {
        // Create new admin user
        adminUser = new User({
          email: 'admin@notifyx.com',
          password: 'Admin123!',
          name: 'Admin User',
          mobile: '9876543210',
          role: 'admin',
          subscriptionStatus: 'active',
          subscriptionPlan: 'premium',
          isProfileComplete: true
        });
      await adminUser.save();
      console.log('✅ Created new admin user');
    }

    console.log('Admin user details:');
    console.log(`Email: ${adminUser.email}`);
    console.log(`Role: ${adminUser.role}`);
    console.log(`Subscription Status: ${adminUser.subscriptionStatus}`);
    console.log(`Subscription Plan: ${adminUser.subscriptionPlan}`);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createAdminUser();
