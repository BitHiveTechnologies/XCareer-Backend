#!/usr/bin/env ts-node

import mongoose from 'mongoose';
import { config } from '../src/config/environment';
import { User } from '../src/models/User';

async function deleteAndRecreateAdmin() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Database connected');
    
    // Delete existing admin
    await User.deleteOne({ email: 'admin@notifyx.com' });
    console.log('🗑️  Deleted existing admin user');
    
    // Create new admin
    const adminUser = new User({
      email: 'admin@notifyx.com',
      password: 'Admin123!', // Will be hashed by pre-save middleware
      name: 'Admin User',
      mobile: '9999999999',
      role: 'admin',
      subscriptionStatus: 'active',
      subscriptionPlan: 'premium',
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isProfileComplete: true
    });
    
    await adminUser.save();
    console.log('✅ Created new admin user with proper password hashing');
    
    await mongoose.disconnect();
    console.log('✅ Database disconnected');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

deleteAndRecreateAdmin();
