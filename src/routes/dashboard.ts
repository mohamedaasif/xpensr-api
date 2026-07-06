import express from "express";
import userAuth from "../middleware/auth";
import {
  getDashboardSummary,
  getRecentTransactions,
} from "../controllers/dashboardController";

const dashboardRouter = express.Router();

dashboardRouter.get("/dashboard/summary", userAuth, getDashboardSummary);
dashboardRouter.get(
  "/dashboard/recent/transacation",
  userAuth,
  getRecentTransactions,
);

export default dashboardRouter;
