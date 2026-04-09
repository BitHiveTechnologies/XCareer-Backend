const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

async function checkConnection() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ ERROR: MONGODB_URI is not defined.');
    process.exit(1);
  }

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  console.log('📡 Attempting to connect to MongoDB Atlas...');

  try {
    await client.connect();
    console.log('🔌 Physical connection established.');
    await client.db("admin").command({ ping: 1 });
    console.log('✨ SUCCESS! Your MongoDB Atlas connection is healthy.');
  } catch (error) {
    console.error('❌ CONNECTION FAILED');
    console.error(`👉 Details: ${error.message}`);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔒 Connection closed.');
  }
}

checkConnection();
