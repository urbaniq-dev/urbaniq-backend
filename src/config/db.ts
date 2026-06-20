import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri && process.env.NODE_ENV === 'production') {
      throw new Error('MONGO_URI is not defined in environment variables');
    }
    const conn = await mongoose.connect(mongoUri || 'mongodb://localhost:27017/urbaniq');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
