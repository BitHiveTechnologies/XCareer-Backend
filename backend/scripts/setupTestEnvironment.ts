import { execSync } from 'child_process';
import { logger } from '../src/utils/logger';

async function setupTestEnvironment() {
  logger.info('🚀 Setting up Test Environment...');
  
  try {
    // Step 1: Seed test data
    logger.info('📊 Seeding test data...');
    execSync('npx ts-node scripts/seedTestData.ts', { stdio: 'inherit' });
    logger.info('✅ Test data seeded successfully');
    
    // Step 2: Run comprehensive API tests
    logger.info('🧪 Running comprehensive API tests...');
    execSync('npx ts-node scripts/comprehensiveApiTest.ts', { stdio: 'inherit' });
    logger.info('✅ API tests completed');
    
    logger.info('🎉 Test environment setup completed successfully!');
    
  } catch (error) {
    logger.error('❌ Test environment setup failed:', error);
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupTestEnvironment();
}

export { setupTestEnvironment };


