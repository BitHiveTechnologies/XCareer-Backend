import mongoose from 'mongoose';
import { Admin } from '../src/models/Admin';
import { config } from '../src/config/environment';
import { logger } from '../src/utils/logger';

async function testAdminCredentials() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Find admin by email
    const admin = await Admin.findOne({ email: 'admin@notifyx.com' });
    
    if (!admin) {
      logger.error('Admin not found');
      return;
    }

    logger.info('Admin found:', {
      id: admin._id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      isActive: admin.isActive,
      permissions: admin.permissions
    });

    // Test password comparison
    const testPassword = 'Admin123!';
    const isPasswordValid = await admin.comparePassword(testPassword);
    
    logger.info('Password test result:', {
      testPassword,
      isValid: isPasswordValid
    });

    // Test with different passwords
    const wrongPasswords = ['admin123!', 'Admin123', 'ADMIN123!', 'Admin123!!'];
    
    for (const wrongPassword of wrongPasswords) {
      const isValid = await admin.comparePassword(wrongPassword);
      logger.info(`Password "${wrongPassword}" test:`, { isValid });
    }

    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');

  } catch (error) {
    logger.error('Test failed:', error);
    await mongoose.disconnect();
  }
}

testAdminCredentials();
