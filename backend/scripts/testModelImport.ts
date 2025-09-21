// Test if models can be imported correctly
import mongoose from 'mongoose';
import { config } from '../src/config/environment';

async function testModelImport() {
  try {
    console.log('Testing model import...');
    
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Import models
    console.log('Importing models...');
    const { Job, Admin, User } = await import('../src/models');
    console.log('Models imported successfully');

    // Test if models are registered
    console.log('Checking if models are registered...');
    const jobModel = mongoose.model('Job');
    const adminModel = mongoose.model('Admin');
    const userModel = mongoose.model('User');
    
    console.log('Job model:', jobModel ? 'OK' : 'FAILED');
    console.log('Admin model:', adminModel ? 'OK' : 'FAILED');
    console.log('User model:', userModel ? 'OK' : 'FAILED');

    // Test a simple query
    console.log('Testing simple job query...');
    const jobs = await Job.find({ isActive: true }).limit(1);
    console.log(`Found ${jobs.length} jobs`);

    await mongoose.disconnect();
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testModelImport();
