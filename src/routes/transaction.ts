import express from "express";
import {
  addTransaction,
  deleteTransaction,
  getAllTransactions,
  updateTransaction,
} from "../controllers/transactionController";
import userAuth from "../middleware/auth";

const transactionRouter = express.Router();

transactionRouter.post("/add/transaction", userAuth, addTransaction);
transactionRouter.get("/all/transactions", userAuth, getAllTransactions);
transactionRouter.patch(
  "/update/transaction/:transactionId",
  userAuth,
  updateTransaction,
);
transactionRouter.delete(
  "/delete/transaction/:transactionId",
  userAuth,
  deleteTransaction,
);

export default transactionRouter;
