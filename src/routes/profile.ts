import express from "express";
import userAuth from "../middleware/auth";
import getProfile from "../controllers/profileController";

const profileRouter = express.Router();

profileRouter.get("/profile/view", userAuth, getProfile);

export default profileRouter;
