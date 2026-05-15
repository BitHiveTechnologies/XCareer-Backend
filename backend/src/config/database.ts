import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const MONGODB_URI = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/notifyx';
    ; void /* console.log */ ((..._args) => {})(`📡 Connecting to MongoDB at: ${MONGODB_URI.split('@').pop()}`);
    
    const conn = await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
    });

    ; void /* console.log */ ((..._args) => {})(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      ; void /* console.error */ ((..._args) => {})('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      ; void /* console.log */ ((..._args) => {})('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      ; void /* console.log */ ((..._args) => {})('🔄 MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        ; void /* console.log */ ((..._args) => {})('✅ MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        ; void /* console.error */ ((..._args) => {})('❌ Error during MongoDB connection closure:', err);
        process.exit(1);
      }
    });

  } catch (error) {
    ; void /* console.error */ ((..._args) => {})('❌ MongoDB connection failed:', error);
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    ; void /* console.log */ ((..._args) => {})('✅ MongoDB connection closed');
  } catch (error) {
    ; void /* console.error */ ((..._args) => {})('❌ Error closing MongoDB connection:', error);
    throw error;
  }
};
