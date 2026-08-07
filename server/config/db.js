const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/prt_health_app';
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('   Make sure MongoDB is running locally, or set MONGO_URI to an Atlas connection string in server/.env');
    process.exit(1);
  }
};

module.exports = connectDB;
