import express from "express";
import userAuth from "../middleware/auth";
import {
  getUserAccountDetails,
  postAccountDetails,
  updateUserAccountDetails,
} from "../controllers/accountController";

const accountRouter = express.Router();

accountRouter.post("/account/details", userAuth, postAccountDetails);
accountRouter.get("/account/details", userAuth, getUserAccountDetails);
accountRouter.patch(
  "/account/details/:accountId",
  userAuth,
  updateUserAccountDetails,
);

export default accountRouter;
