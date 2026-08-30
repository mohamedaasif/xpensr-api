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
          toAccountId: type === TransactionType.Transfer ? toAccountId : null,
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
      toAccountId,
    } = req.body;

    const transactionId = req.params.transactionId;
    const userId = req.user!.id;

    if (!transactionId) {
      throw new Error("Transaction id is required");
    }

    if (amount !== undefined && amount <= 0) {
      throw new Error("Amount must be greater than zero");
    }

    if (accountId === null) {
      throw new Error("Transaction cannot be unlinked manually");
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
    const existingToAccountId = transactionDetails.toAccountId;

    const newAccountId =
      accountId !== undefined ? accountId : existingAccountId;

    const newType = type ?? transactionDetails.type;
    const newAmount = amount ?? transactionDetails.amount;

    let newToAccountId =
      toAccountId !== undefined ? toAccountId : existingToAccountId;

    if (!newAccountId) {
      throw new Error("Account Id is required");
    }

    if (
      newType !== TransactionType.Income &&
      newType !== TransactionType.Expense &&
      newType !== TransactionType.Transfer
    ) {
      throw new Error("Invalid transaction type");
    }

    if (newType === TransactionType.Transfer) {
      if (!newToAccountId) {
        throw new Error("toAccountId field is required for Transfer type");
      }

      if (newAccountId === newToAccountId) {
        throw new Error("From Account and To Account should be different");
      }
    } else {
      // Income / Expense should not have destination account
      newToAccountId = null;
    }

    const updateData: UpdateTransactionBody = {
      accountId: newAccountId,
      toAccountId: newToAccountId,
      type: newType,
      amount: newAmount,
    };

    if (description !== undefined) updateData.description = description;
    if (notes !== undefined) updateData.notes = notes;
    if (location !== undefined) updateData.location = location;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (isRecurring !== undefined) updateData.isRecurring = isRecurring;
    if (referenceNo !== undefined) updateData.referenceNo = referenceNo;
    if (transactionDate !== undefined)
      updateData.transactionDate = new Date(transactionDate);

    // ATOMIC TRANSACTION
    const updatedTransaction = await prisma.$transaction(async (tx) => {
      // =======================================================
      // OLD SOURCE ACCOUNT
      //
      // This can be null because account may have been deleted.
      // =======================================================

      let existingAccount = null;

      if (existingAccountId) {
        existingAccount = await tx.account.findFirst({
          where: {
            id: existingAccountId,
            userId,
          },
        });
      }

      // =======================================================
      // OLD DESTINATION ACCOUNT
      //
      // This can also be null because account may have
      // been deleted.
      // =======================================================

      let existingToAccount = null;

      if (existingToAccountId) {
        existingToAccount = await tx.account.findFirst({
          where: {
            id: existingToAccountId,
            userId,
          },
        });
      }

      // =======================================================
      // NEW SOURCE ACCOUNT
      //
      // This MUST exist.
      // =======================================================

      const newAccount = await tx.account.findFirst({
        where: {
          id: newAccountId,
          userId,
        },
      });

      if (!newAccount) {
        throw new Error("Account not found");
      }

      // =======================================================
      // NEW DESTINATION ACCOUNT
      //
      // Required only for Transfer.
      // =======================================================

      let newToAccount = null;

      if (newType === TransactionType.Transfer) {
        newToAccount = await tx.account.findFirst({
          where: {
            id: newToAccountId!,
            userId,
          },
        });

        if (!newToAccount) {
          throw new Error("Transfer to account is not found");
        }
      }

      // =======================================================
      // 1. REVERSE OLD TRANSACTION
      // =======================================================

      // OLD INCOME
      if (
        transactionDetails.type === TransactionType.Income &&
        existingAccount
      ) {
        await tx.account.update({
          where: {
            id: existingAccount.id,
          },
          data: {
            balance: {
              decrement: transactionDetails.amount,
            },
          },
        });
      }

      // OLD EXPENSE
      if (
        transactionDetails.type === TransactionType.Expense &&
        existingAccount
      ) {
        await tx.account.update({
          where: {
            id: existingAccount.id,
          },
          data: {
            balance: {
              increment: transactionDetails.amount,
            },
          },
        });
      }

      if (transactionDetails.type === TransactionType.Transfer) {
        if (existingAccount) {
          await tx.account.update({
            where: {
              id: existingAccount.id,
            },
            data: {
              balance: {
                increment: transactionDetails.amount,
              },
            },
          });
        }

        if (existingToAccount) {
          await tx.account.update({
            where: {
              id: existingToAccount.id,
            },
            data: {
              balance: {
                decrement: transactionDetails.amount,
              },
            },
          });
        }
      }

      // =======================================================
      // 2. GET SOURCE ACCOUNT AGAIN
      //
      // We reversed the old transaction above, so we need the
      // latest balance before applying the new transaction.
      // =======================================================

      const sourceAccount = await tx.account.findFirst({
        where: {
          id: newAccountId,
          userId,
        },
      });

      if (!sourceAccount) {
        throw new Error("Account not found");
      }

      // =======================================================
      // 3. APPLY NEW TRANSACTION
      // =======================================================

      // NEW INCOME
      if (newType === TransactionType.Income) {
        await tx.account.update({
          where: {
            id: sourceAccount.id,
          },
          data: {
            balance: {
              increment: newAmount,
            },
          },
        });
      }

      // NEW EXPENSE
      if (newType === TransactionType.Expense) {
        if (sourceAccount.balance < newAmount) {
          throw new Error(
            `Insufficient balance. Available balance is ${sourceAccount.balance}`,
          );
        }

        await tx.account.update({
          where: {
            id: sourceAccount.id,
          },
          data: {
            balance: {
              decrement: newAmount,
            },
          },
        });
      }

      // NEW TRANSFER
      if (newType === TransactionType.Transfer) {
        if (sourceAccount.balance < newAmount) {
          throw new Error(
            `Insufficient balance. Available balance is ${sourceAccount.balance}`,
          );
        }

        await tx.account.update({
          where: {
            id: sourceAccount.id,
          },
          data: {
            balance: {
              decrement: newAmount,
            },
          },
        });

        await tx.account.update({
          where: {
            id: newToAccount!.id,
          },
          data: {
            balance: {
              increment: newAmount,
            },
          },
        });
      }

      // 4. UPDATE TRANSACTION
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
