const express = require("express");
const { connectDB } = require("./src/config/database");
require("dotenv").config();

const app = express();

connectDB()
  .then(() => {
    console.log("Database connection established...");
    app.listen(process.env.PORT, () => {
      console.log(
        "Server is successfully listening on port: " + process.env.PORT,
      );
    });
  })
  .catch((err) => {
    console.error("Error: ", err);
  });
