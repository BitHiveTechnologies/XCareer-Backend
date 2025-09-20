import mongoose from 'mongoose';
import { User } from '../src/models/User';
import { Admin } from '../src/models/Admin';
import { config } from '../src/config/environment';
import { logger } from '../src/utils/logger';

async function checkUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Check users
    const users = await User.find({}, 'email name subscriptionStatus');
    logger.info('Users in database:', users.length);
    users.forEach(user => {
      logger.info(`- Email: ${user.email}, Name: ${user.name}, Status: ${user.subscriptionStatus}`);
    });

    // Check admins
    const admins = await Admin.find({}, 'email name role isActive');
    logger.info('Admins in database:', admins.length);
    admins.forEach(admin => {
      logger.info(`- Email: ${admin.email}, Name: ${admin.name}, Role: ${admin.role}, Active: ${admin.isActive}`);
    });

    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');

  } catch (error) {
    logger.error('Check failed:', error);
    await mongoose.disconnect();
  }
}

checkUsers();

