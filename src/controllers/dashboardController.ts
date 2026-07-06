import { Request, Response } from "express";
import prisma from "../config/prisma";
import { PaymentType, TransactionType } from "@prisma/client";

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    if (!userId) throw new Error("User is not authorized");
    const [totalBalance, totalIncome, totalExpense] = await Promise.all([
      prisma.account.aggregate({
        where: { userId },
        _sum: {
          balance: true,
        },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: TransactionType.Income },
        _sum: {
          amount: true,
        },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: TransactionType.Expense },
        _sum: {
          amount: true,
        },
      }),
    ]);
    return res.status(200).json({
      success: true,
      data: {
        totalBalance: totalBalance._sum.balance ?? 0,
        totalIncome: totalIncome._sum.amount ?? 0,
        totalExpense: totalExpense._sum.amount ?? 0,
      },
    });
  } catch (err) {
    const error = err as Error;
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getRecentTransactions = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    if (!userId) throw new Error("User is not authorized");
    const recentTransaction = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { transactionDate: "desc" },
      take: 5,
    });
    if (!recentTransaction) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No transactions available",
      });
    }

    res.status(200).json({
      success: true,
      data: recentTransaction,
    });
  } catch (err) {
    const error = err as Error;
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
