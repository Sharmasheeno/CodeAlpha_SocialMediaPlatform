const mongoose = require('mongoose');

// Fail fast instead of hanging when no database is connected,
// so API routes can return a graceful error JSON.
mongoose.set('bufferCommands', false);

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/codealpha_social';
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    // Do NOT exit: the server must still start and serve the frontend
    // even when MongoDB is unreachable.
    console.error(`MongoDB connection error: ${err.message}`);
    console.error('Server will keep running; API data routes need a reachable MongoDB.');
  }
};

module.exports = connectDB;
