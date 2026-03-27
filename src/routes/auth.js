const express = require("express");
const { signup } = require("../controllers/authController");
const userRouter = express.Router();

userRouter.post("/signup", signup);

module.exports = userRouter;
