import mongoose from 'mongoose';
import { config } from '../src/config/environment';
import { sendJobAlertsEnhanced } from '../src/services/enhancedJobAlertService';

// Import models to ensure they're registered
import '../src/models/User';
import '../src/models/UserProfile';
import '../src/models/Job';
import '../src/models/JobNotification';
import '../src/models/Subscription';

async function testControllerLogic() {
  try {
    console.log('🔍 Testing controller logic...');
    
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Database connected');
    
    // Simulate the exact logic from the controller
    const jobId = '68d912be08f77f9137b4df1f';
    const minMatchScore = 40;
    const maxUsers = 100;
    const dryRun = false;
    
    console.log('📋 Controller parameters:', {
      jobId,
      minMatchScore,
      maxUsers,
      dryRun
    });
    
    // This is the exact call from the controller
    const result = await sendJobAlertsEnhanced({
      jobId,
      minimumMatchPercentage: minMatchScore,
      maxUsers,
      dryRun
    });
    
    console.log('✅ Enhanced service result:', result);
    
    // This is the exact stats conversion from the controller
    const stats = {
      totalEligibleUsers: result.totalEligibleUsers,
      emailsSent: result.emailsSent,
      emailsFailed: result.emailsFailed,
      duplicateNotifications: result.duplicateNotifications,
      usersWithoutProfile: 0, // Enhanced service doesn't track this separately
      usersWithInactiveSubscription: 0 // Enhanced service doesn't track this separately
    };
    
    console.log('✅ Converted stats:', stats);
    
    // This is the exact response from the controller
    const response = {
      success: true,
      message: dryRun ? 'Job alerts dry run completed' : 'Job alerts sent successfully',
      data: {
        jobId,
        stats,
        dryRun
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Controller response:', JSON.stringify(response, null, 2));
    
    await mongoose.disconnect();
    console.log('✅ Controller logic test completed successfully!');
    
  } catch (error) {
    console.error('❌ Controller logic test error:', error);
    console.error('Stack trace:', error.stack);
    await mongoose.disconnect();
  }
}

testControllerLogic();
