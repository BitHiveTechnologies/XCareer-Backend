#!/usr/bin/env ts-node

/**
 * Create Admin User Script
 * 
 * This script creates an admin user account for testing purposes.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../src/config/environment';
import { User } from '../src/models/User';

const ADMIN_USER_DATA = {
  email: 'admin@notifyx.com',
  password: 'Admin123!',
  name: 'Admin User',
  mobile: '9999999999',
  role: 'admin'
};

async function connectDatabase() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

async function createAdminUser() {
  console.log('👑 Creating Admin User...\n');
  
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: ADMIN_USER_DATA.email });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`👤 Name: ${existingAdmin.name}`);
      console.log(`🛡️  Role: ${existingAdmin.role}`);
      console.log(`🔑 Password needs to be reset if you don't remember it`);
      return existingAdmin;
    }
    
    // Create admin user (password will be hashed by User model pre-save middleware)
    const adminUser = new User({
      email: ADMIN_USER_DATA.email,
      password: ADMIN_USER_DATA.password,
      name: ADMIN_USER_DATA.name,
      mobile: ADMIN_USER_DATA.mobile,
      role: ADMIN_USER_DATA.role,
      subscriptionStatus: 'active', // Admin doesn't need subscription but set as active
      subscriptionPlan: 'premium', // Use premium plan for admin
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      isProfileComplete: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await adminUser.save();
    
    console.log('✅ Admin user created successfully!');
    console.log(`📧 Email: ${ADMIN_USER_DATA.email}`);
    console.log(`🔑 Password: ${ADMIN_USER_DATA.password}`);
    console.log(`👤 Name: ${ADMIN_USER_DATA.name}`);
    console.log(`🛡️  Role: ${ADMIN_USER_DATA.role}`);
    
    return adminUser;
    
  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
    throw error;
  }
}

async function verifyAdminUser() {
  console.log('\n🔍 Verifying admin user credentials...\n');
  
  try {
    const adminUser = await User.findOne({ email: ADMIN_USER_DATA.email });
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return false;
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(ADMIN_USER_DATA.password, adminUser.password!);
    
    if (isPasswordValid) {
      console.log('✅ Admin credentials are valid');
      console.log(`📧 Email: ${adminUser.email}`);
      console.log(`🛡️  Role: ${adminUser.role}`);
      console.log(`🔑 Password verification: SUCCESS`);
      return true;
    } else {
      console.log('❌ Admin password verification failed');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Failed to verify admin user:', error);
    return false;
  }
}

async function resetAdminPassword() {
  console.log('\n🔄 Resetting admin password...\n');
  
  try {
    const adminUser = await User.findOne({ email: ADMIN_USER_DATA.email });
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return false;
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(ADMIN_USER_DATA.password, config.BCRYPT_ROUNDS);
    
    // Update password
    adminUser.password = hashedPassword;
    adminUser.updatedAt = new Date();
    await adminUser.save();
    
    console.log('✅ Admin password reset successfully!');
    console.log(`🔑 New password: ${ADMIN_USER_DATA.password}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to reset admin password:', error);
    return false;
  }
}

async function main() {
  console.log('👑 Admin User Management\n');
  console.log('========================\n');
  
  try {
    // Connect to database
    await connectDatabase();
    
    // Check command line arguments
    const args = process.argv.slice(2);
    
    if (args.includes('--reset-password')) {
      await resetAdminPassword();
    } else if (args.includes('--verify')) {
      await verifyAdminUser();
    } else {
      // Create admin user
      await createAdminUser();
      
      // Verify credentials
      await verifyAdminUser();
    }
    
    console.log('\n🎉 Admin user management completed!');
    console.log('\n📋 Admin Credentials:');
    console.log(`   Email: ${ADMIN_USER_DATA.email}`);
    console.log(`   Password: ${ADMIN_USER_DATA.password}`);
    console.log('\n🚀 You can now test admin login with:');
    console.log('   npm run test:admin-login');
    
  } catch (error) {
    console.error('\n❌ Admin user management failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database disconnected');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { createAdminUser, verifyAdminUser, resetAdminPassword };