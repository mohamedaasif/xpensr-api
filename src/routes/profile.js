const express = require("express");
const { userAuth } = require("../middleware/auth");
const { getProfile } = require("../controllers/profileController");

const profileRouter = express.Router();

profileRouter.get("/profile/view", userAuth, getProfile);

module.exports = profileRouter;
