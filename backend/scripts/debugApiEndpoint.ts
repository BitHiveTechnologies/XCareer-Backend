import mongoose from 'mongoose';
import { config } from '../src/config/environment';
import { sendJobAlertsEnhanced } from '../src/services/enhancedJobAlertService';

// Import models to ensure they're registered
import '../src/models/User';
import '../src/models/UserProfile';
import '../src/models/Job';
import '../src/models/JobNotification';
import '../src/models/Subscription';

async function debugApiEndpoint() {
  try {
    console.log('🔍 Debugging API endpoint issue...');
    
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Database connected');
    
    // Test the exact same call that the API endpoint makes
    const jobId = '68d912be08f77f9137b4df1f';
    const minMatchScore = 40;
    const maxUsers = 100;
    const dryRun = false;
    
    console.log('📋 Testing with parameters:', {
      jobId,
      minimumMatchPercentage: minMatchScore,
      maxUsers,
      dryRun
    });
    
    const result = await sendJobAlertsEnhanced({
      jobId,
      minimumMatchPercentage: minMatchScore,
      maxUsers,
      dryRun
    });
    
    console.log('✅ Enhanced job alert result:', {
      emailsSent: result.emailsSent,
      totalEligibleUsers: result.totalEligibleUsers,
      emailsFailed: result.emailsFailed,
      duplicateNotifications: result.duplicateNotifications
    });
    
    if (result.emailsSent > 0) {
      const recipients = result.userMatches
        .filter(match => match.emailSent)
        .map(match => match.email);
      console.log('📧 Email recipients:', recipients);
    }
    
    await mongoose.disconnect();
    console.log('✅ Debug completed successfully!');
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    console.error('Stack trace:', error.stack);
    await mongoose.disconnect();
  }
}

debugApiEndpoint();
