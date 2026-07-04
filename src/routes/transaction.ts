import express from "express";
import {
  addTransaction,
  deleteTransaction,
  getAllTransactions,
  updateTransaction,
} from "../controllers/transactionController";

const transactionRouter = express.Router();

transactionRouter.post("/add/transaction", addTransaction);
transactionRouter.get("/all/transactions", getAllTransactions);
transactionRouter.patch(
  "/update/transaction/:transactionId",
  updateTransaction,
);
transactionRouter.delete(
  "/delete/transaction/:transactionId",
  deleteTransaction,
);

export default transactionRouter;
