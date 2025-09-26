import mongoose from 'mongoose';
import { User } from '../src/models/User';

async function checkUserSubscriptionPlans() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/notifyx');
    console.log('✅ Connected to MongoDB');

    // Get all users and their subscription plans
    const users = await User.find({}).select('email subscriptionPlan role');
    
    console.log('\n📊 USER SUBSCRIPTION PLANS');
    console.log('==========================');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Subscription Plan: ${user.subscriptionPlan || 'not set'}`);
      console.log('');
    });

    // Check if we have users with different subscription plans
    const basicUsers = users.filter(u => u.subscriptionPlan === 'basic');
    const premiumUsers = users.filter(u => u.subscriptionPlan === 'premium');
    const enterpriseUsers = users.filter(u => (u.subscriptionPlan as string) === 'enterprise');

    console.log('📈 SUMMARY:');
    console.log(`   Basic users: ${basicUsers.length}`);
    console.log(`   Premium users: ${premiumUsers.length}`);
    console.log(`   Enterprise users: ${enterpriseUsers.length}`);

    if (premiumUsers.length === 0 && enterpriseUsers.length === 0) {
      console.log('\n⚠️  No premium or enterprise users found!');
      console.log('   We need to create test users with different subscription plans.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkUserSubscriptionPlans();
