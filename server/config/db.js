const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Note: If running locally without a real URI configured yet, we log the error.
    // In production or full config, you may use process.exit(1)
  }
};

module.exports = connectDB;
