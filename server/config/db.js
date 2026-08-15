const mongoose = require("mongoose");

let connectionPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error(
      "MONGO_URI is not configured in .env"
    );
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(
      mongoUri,
      {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      }
    );
  }

  try {
    await connectionPromise;

    console.log("MongoDB connected");
  } catch (error) {
    connectionPromise = null;

    console.error(
      "MongoDB connection failed:",
      error.message
    );

    throw error;
  }
};

module.exports = connectDB;