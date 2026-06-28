const express = require("express");
const { userAuth } = require("../middleware/auth");
const {
  postAccountDetails,
  getUserAccountDetails,
  updateUserAccountDetails,
} = require("../controllers/accountController");

const accountRouter = express.Router();

accountRouter.post("/account/details", userAuth, postAccountDetails);
accountRouter.get("/account/details", userAuth, getUserAccountDetails);
accountRouter.patch("/account/details/:id", userAuth, updateUserAccountDetails);

module.exports = accountRouter;
