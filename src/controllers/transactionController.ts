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
      toAccountId,
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
    if (type === TransactionType.Transfer && !toAccountId)
      throw new Error("toAccountId field is required for Transfer type");
    if (type === TransactionType.Transfer && accountId === toAccountId)
      throw new Error("From Account and To Account should be different");

    const accountDetails = await prisma.account.findUnique({
      where: { id: accountId, userId: req.user!.id },
    });

    if (!accountDetails) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    if (type === TransactionType.Transfer) {
      const toAccountDetails = await prisma.account.findUnique({
        where: { id: toAccountId, userId: req.user!.id },
      });

      if (!toAccountDetails) {
        return res.status(404).json({
          success: false,
          message: "Transfer to account is not found",
        });
      }
    }

    const transactionDetails = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          userId: req.user!.id,
          accountId,
          toAccountId,
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

      if (type === TransactionType.Expense) {
        await tx.account.update({
          where: {
            id: accountId,
          },
          data: {
            balance: {
              decrement: amount,
            },
          },
        });
      }

      if (type === TransactionType.Income) {
        await tx.account.update({
          where: {
            id: accountId,
          },
          data: {
            balance: {
              increment: amount,
            },
          },
        });
      }

      if (type === TransactionType.Transfer) {
        const sourceUpdate = await tx.account.updateMany({
          where: {
            id: accountId,
            userId: req.user!.id,
            balance: {
              gte: amount,
            },
          },
          data: {
            balance: {
              decrement: amount,
            },
          },
        });

        if (sourceUpdate.count !== 1) {
          throw new Error("Insufficient balance");
        }

        await tx.account.update({
          where: {
            id: toAccountId,
          },
          data: {
            balance: {
              increment: amount,
            },
          },
        });
      }
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
      include: {
        account: true,
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
      accountId,
    } = req.body;

    const transactionId = req.params.transactionId;
    const userId = req.user!.id;

    if (!transactionId) {
      throw new Error("Transaction id is required");
    }

    const transactionDetails = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
      },
    });

    if (!transactionDetails) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    const existingAccountId = transactionDetails.accountId;

    if (accountId === null) {
      throw new Error("Transaction cannot be unlinked manually");
    }

    const newAccountId =
      accountId !== undefined ? accountId : existingAccountId;

    const newType = type ?? transactionDetails.type;
    const newAmount = amount ?? transactionDetails.amount;

    const oldEffect =
      transactionDetails.type === TransactionType.Income
        ? transactionDetails.amount
        : -transactionDetails.amount;

    const newEffect =
      newType === TransactionType.Income ? newAmount : -newAmount;

    let updateData: UpdateTransactionBody = {};

    if (accountId !== undefined) updateData.accountId = accountId;
    if (type !== undefined) updateData.type = type;
    if (amount !== undefined) updateData.amount = amount;
    if (description !== undefined) updateData.description = description;
    if (notes !== undefined) updateData.notes = notes;
    if (location !== undefined) updateData.location = location;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (isRecurring !== undefined) updateData.isRecurring = isRecurring;
    if (referenceNo !== undefined) updateData.referenceNo = referenceNo;
    if (transactionDate !== undefined) {
      updateData.transactionDate = new Date(transactionDate);
    }

    const updatedTransaction = await prisma.$transaction(async (tx) => {
      let existingAccount = null;

      if (existingAccountId) {
        existingAccount = await tx.account.findFirst({
          where: {
            id: existingAccountId,
            userId,
          },
        });

        if (!existingAccount) {
          throw new Error("Existing account not found");
        }
      }

      let newAccount = null;

      if (newAccountId) {
        newAccount = await tx.account.findFirst({
          where: {
            id: newAccountId,
            userId,
          },
        });

        if (!newAccount) {
          throw new Error("Account not found");
        }
      }
      // Link orphaned transaction
      if (!existingAccountId && newAccount) {
        const updatedBalance = newAccount.balance + newEffect;

        if (newType === TransactionType.Expense && updatedBalance < 0) {
          throw new Error(
            `Insufficient balance. Available balance is ${newAccount.balance}`,
          );
        }

        await tx.account.update({
          where: {
            id: newAccount.id,
          },
          data: {
            balance: updatedBalance,
          },
        });
      }
      // Same account
      else if (
        existingAccount &&
        newAccount &&
        existingAccountId === newAccountId
      ) {
        if (type !== undefined || amount !== undefined) {
          const updatedBalance =
            existingAccount.balance - oldEffect + newEffect;

          if (newType === TransactionType.Expense && updatedBalance < 0) {
            throw new Error(
              `Insufficient balance. Available balance is ${
                existingAccount.balance - oldEffect
              }`,
            );
          }

          await tx.account.update({
            where: {
              id: existingAccount.id,
            },
            data: {
              balance: updatedBalance,
            },
          });
        }
      } else if (
        existingAccount &&
        newAccount &&
        existingAccountId !== newAccountId
      ) {
        const restoredOldBalance = existingAccount.balance - oldEffect;

        await tx.account.update({
          where: {
            id: existingAccount.id,
          },
          data: {
            balance: restoredOldBalance,
          },
        });

        const updatedNewBalance = newAccount.balance + newEffect;

        if (newType === TransactionType.Expense && updatedNewBalance < 0) {
          throw new Error(
            `Insufficient balance. Available balance is ${newAccount.balance}`,
          );
        }

        await tx.account.update({
          where: {
            id: newAccount.id,
          },
          data: {
            balance: updatedNewBalance,
          },
        });
      }

      return tx.transaction.update({
        where: {
          id: transactionId,
        },
        data: updateData,
      });
    });

    return res.status(200).json({
      success: true,
      message: "Transaction updated successfully",
      data: updatedTransaction,
    });
  } catch (err) {
    const error = err as Error;

    return res.status(400).json({
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

    const transactionDetails = await prisma.transaction.findFirst({
      where: { id: transactionId, userId: req.user!.id },
    });

    if (!transactionDetails) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    await prisma.$transaction(async (tx) => {
      if (
        transactionDetails.type === TransactionType.Expense &&
        transactionDetails.accountId
      ) {
        await tx.account.update({
          where: {
            id: transactionDetails.accountId,
          },
          data: {
            balance: {
              increment: transactionDetails.amount,
            },
          },
        });
      }

      if (
        transactionDetails.type === TransactionType.Income &&
        transactionDetails.accountId
      ) {
        await tx.account.update({
          where: {
            id: transactionDetails.accountId,
          },
          data: {
            balance: {
              decrement: transactionDetails.amount,
            },
          },
        });
      }

      if (transactionDetails.type === TransactionType.Transfer) {
        if (transactionDetails.accountId) {
          await tx.account.update({
            where: {
              id: transactionDetails.accountId,
            },
            data: {
              balance: {
                increment: transactionDetails.amount,
              },
            },
          });
        }

        if (transactionDetails.toAccountId) {
          await tx.account.update({
            where: {
              id: transactionDetails.toAccountId,
            },
            data: {
              balance: {
                decrement: transactionDetails.amount,
              },
            },
          });
        }
      }

      await tx.transaction.delete({
        where: {
          id: transactionDetails.id,
        },
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
