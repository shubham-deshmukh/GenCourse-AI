import mongoose from 'mongoose';
import { getEnv } from './env.js';

const connectDB = async () => {
  try {
    const MONGO_URI = getEnv('MONGO_URI');
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`🔌 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Database connection error: ${error.message}`);
    process.exit(1);
  }
};


export default connectDB;
