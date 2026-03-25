const mongoose = require("mongoose");

async function connectDB() {
  await mongoose.connect(process.env.DB_CONNECTION_SECRET);
}

module.exports = { connectDB };
