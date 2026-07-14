import { Request, Response } from "express";
import prisma from "../config/prisma";
import { PaymentType, TransactionType } from "@prisma/client";

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    if (!userId) throw new Error("User is not authorized");
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    );

    const endOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    const [
      totalBalance,
      totalIncome,
      totalExpense,
      currentMonthIncome,
      currentMonthExpense,
    ] = await Promise.all([
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
      prisma.transaction.aggregate({
        where: {
          userId,
          type: TransactionType.Income,
          transactionDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.transaction.aggregate({
        where: {
          userId,
          type: TransactionType.Expense,
          transactionDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);
    const income = totalIncome._sum.amount ?? 0;
    const expense = totalExpense._sum.amount ?? 0;

    const netSavings = income - expense;
    const savingsRate =
      income > 0 ? Number(((netSavings / income) * 100).toFixed(2)) : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalBalance: totalBalance._sum.balance ?? 0,
        totalIncome: totalIncome._sum.amount ?? 0,
        totalExpense: totalExpense._sum.amount ?? 0,
        netSavings,
        savingsRate,
        currentMonthIncome: currentMonthIncome._sum.amount ?? 0,
        currentMonthExpense: currentMonthExpense._sum.amount ?? 0,
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
      include: {
        account: true, // TODO - value should come from req
      },
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
