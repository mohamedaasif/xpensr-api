import { Request, Response } from "express";
import {
  TransactionBody,
  UpdateTransactionBody,
} from "../interfaces/transaction.interface";
import prisma from "../config/prisma";
import { TransactionType } from "@prisma/client";

export const addTransaction = async (
  req: Request<{}, {}, TransactionBody>,
  res: Response,
) => {
  try {
    const {
      accountId,
      type,
      amount,
      description,
      notes,
      transactionDate,
      paymentMethod,
      referenceNo,
      location,
      isRecurring,
    } = req.body;

    if (!accountId) throw new Error("Account Id is required");

    const accountDetails = await prisma.account.findUnique({
      where: { id: accountId, userId: req.user!.id },
    });

    if (!accountDetails) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    let updatedBalance = accountDetails.balance;
    if (type === TransactionType.Expense) {
      updatedBalance -= amount;
    } else if (type === TransactionType.Income) {
      updatedBalance += amount;
    }

    const transactionDetails = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          userId: req.user!.id,
          accountId,
          type,
          amount,
          description,
          notes,
          transactionDate: new Date(transactionDate),
          paymentMethod,
          referenceNo,
          location,
          isRecurring,
        },
      });

      await tx.account.update({
        where: { id: accountId },
        data: {
          balance: updatedBalance,
        },
      });
      return transaction;
    });

    res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      data: transactionDetails,
    });
  } catch (err) {
    const error = err as Error;
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllTransactions = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
      },
      orderBy: {
        transactionDate: "desc",
      },
    });
    return res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (err) {
    const error = err as Error;
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateTransaction = async (
  req: Request<{ transactionId: string }, {}, UpdateTransactionBody>,
  res: Response,
) => {
  try {
    const {
      type,
      amount,
      description,
      notes,
      location,
      paymentMethod,
      isRecurring,
      referenceNo,
      transactionDate,
    } = req.body;
    const transactionId = req.params.transactionId;

    if (!transactionId) {
      throw new Error("Transaction id is required");
    }

    const transactionDetails = await prisma.transaction.findUnique({
      where: { id: transactionId, userId: req.user!.id },
    });

    if (!transactionDetails) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    const accountDetails = await prisma.account.findUnique({
      where: { id: transactionDetails.accountId },
    });

    if (!accountDetails) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    let updatedBalance = 0;

    if (type !== undefined || amount !== undefined) {
      const newType = type ?? transactionDetails.type;
      const newAmount = amount ?? transactionDetails.amount;

      const oldEffect =
        transactionDetails.type === TransactionType.Income
          ? transactionDetails.amount
          : -transactionDetails.amount;

      const newEffect =
        newType === TransactionType.Income ? newAmount : -newAmount;

      updatedBalance = accountDetails.balance - oldEffect + newEffect;
    }

    let updateData: UpdateTransactionBody = {};

    if (type !== undefined) updateData.type = type;
    if (amount !== undefined) updateData.amount = amount;
    if (description !== undefined) updateData.description = description;
    if (notes !== undefined) updateData.notes = notes;
    if (location !== undefined) updateData.location = location;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (isRecurring !== undefined) updateData.isRecurring = isRecurring;
    if (referenceNo !== undefined) updateData.referenceNo = referenceNo;
    if (transactionDate !== undefined)
      updateData.transactionDate = new Date(transactionDate);

    const updatedTransaction = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.update({
        where: { id: transactionId },
        data: updateData,
      });

      if (type !== undefined || amount !== undefined) {
        await tx.account.update({
          where: { id: transactionDetails.accountId },
          data: { balance: updatedBalance },
        });
      }

      return transaction;
    });

    return res.status(200).json({
      success: true,
      message: "Transaction updated successfully",
      data: updatedTransaction,
    });
  } catch (err) {
    const error = err as Error;
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteTransaction = async (
  req: Request<{ transactionId: string }>,
  res: Response,
) => {
  try {
    const transactionId = req.params.transactionId;
    if (!transactionId) {
      throw new Error("Transaction id is required");
    }

    const transactionDetails = await prisma.transaction.findUnique({
      where: { id: transactionId, userId: req.user!.id },
    });

    if (!transactionDetails) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    const accountDetails = await prisma.account.findUnique({
      where: { id: transactionDetails.accountId },
    });

    if (!accountDetails) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    let updatedBalance = accountDetails.balance;

    if (transactionDetails.type === TransactionType.Expense) {
      updatedBalance += transactionDetails.amount;
    } else if (transactionDetails.type === TransactionType.Income) {
      updatedBalance -= transactionDetails.amount;
    }

    await prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { id: accountDetails.id },
        data: {
          balance: updatedBalance,
        },
      });

      await tx.transaction.delete({
        where: { id: transactionId },
      });
    });

    return res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (err) {
    const error = err as Error;
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
