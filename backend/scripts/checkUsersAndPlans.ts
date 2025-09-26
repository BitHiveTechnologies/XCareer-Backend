import mongoose from 'mongoose';
import { config } from '../src/config/environment';
import { User } from '../src/models/User';

async function checkUsersAndPlans() {
  console.log('👥 CHECKING USERS AND SUBSCRIPTION PLANS');
  console.log('=======================================\n');

  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const users = await User.find().select('email role subscriptionPlan subscriptionStatus');

    console.log('📊 FOUND USERS:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Subscription Plan: ${user.subscriptionPlan}`);
      console.log(`   Subscription Status: ${user.subscriptionStatus}`);
      console.log('');
    });

    // Check if we have users with different subscription plans
    const basicUsers = users.filter(u => u.subscriptionPlan === 'basic');
    const premiumUsers = users.filter(u => u.subscriptionPlan === 'premium');
    const enterpriseUsers = users.filter(u => (u.subscriptionPlan as string) === 'enterprise');

    console.log('📈 SUMMARY:');
    console.log(`   Total users: ${users.length}`);
    console.log(`   Basic users: ${basicUsers.length}`);
    console.log(`   Premium users: ${premiumUsers.length}`);
    console.log(`   Enterprise users: ${enterpriseUsers.length}`);

    // Show specific users for testing
    console.log('\n🔍 USERS FOR TESTING:');
    if (basicUsers.length > 0) {
      console.log(`   Basic user: ${basicUsers[0].email}`);
    }
    if (premiumUsers.length > 0) {
      console.log(`   Premium user: ${premiumUsers[0].email}`);
    }
    if (enterpriseUsers.length > 0) {
      console.log(`   Enterprise user: ${enterpriseUsers[0].email}`);
    }

  } catch (error: any) {
    console.error('❌ Error checking users:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkUsersAndPlans();
