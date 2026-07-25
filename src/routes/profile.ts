import express from "express";
import userAuth from "../middleware/auth";
import { getProfile, updateProfile } from "../controllers/profileController";

const profileRouter = express.Router();

profileRouter.get("/profile/view", userAuth, getProfile);
profileRouter.patch("/profile/edit", userAuth, updateProfile);

export default profileRouter;
