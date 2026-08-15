import { Request, Response } from "express";
import prisma from "../config/prisma";
import {
  AccountBody,
  UpdateAccountBody,
} from "../interfaces/account.interface";
import { AccountType } from "@prisma/client";

export async function postAccountDetails(
  req: Request<{}, {}, AccountBody>,
  res: Response,
) {
  try {
    const {
      name,
      type,
      bankName,
      openingBalance,
      currency,
      isDefault,
      isArchived,
    } = req.body;

    const accountDetails = await prisma.account.create({
      data: {
        userId: req.user!.id,
        name,
        type,
        bankName,
        openingBalance,
        balance: openingBalance,
        currency,
        isDefault,
        isArchived,
      },
    });

    if (isDefault) {
      await prisma.account.updateMany({
        where: {
          userId: req.user!.id,
          id: {
            not: accountDetails.id,
          },
        },
        data: {
          isDefault: false,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: "Account details saved successfully",
      data: accountDetails,
    });
  } catch (err) {
    const error = err as Error;
    res.status(400).send({ message: error.message });
  }
}

export async function getUserAccountDetails(req: Request, res: Response) {
  try {
    const accountDetails = await prisma.account.findMany({
      where: { userId: req.user!.id },
    });
    res.status(200).json({
      success: true,
      data: accountDetails,
    });
  } catch (err) {
    const error = err as Error;

    res.status(400).send({ message: error.message });
  }
}

export async function updateUserAccountDetails(
  req: Request<{ accountId: string }, {}, UpdateAccountBody>,
  res: Response,
) {
  try {
    const accountId = req.params.accountId;
    const { name, type, bankName, currency, isDefault, isArchived } = req.body;

    if (!accountId) {
      throw new Error("Account ID is required");
    }

    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: req.user!.id,
      },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    const updateData: UpdateAccountBody = {};

    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (bankName !== undefined) updateData.bankName = bankName;
    if (currency !== undefined) updateData.currency = currency;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (isArchived !== undefined) updateData.isArchived = isArchived;

    const updatedAccount = await prisma.account.update({
      where: {
        id: accountId,
      },
      data: updateData,
    });

    if (isDefault) {
      await prisma.account.updateMany({
        where: {
          userId: req.user!.id,
          id: {
            not: accountId,
          },
        },
        data: {
          isDefault: false,
        },
      });
    }
    res.status(200).json({
      success: true,
      message: "Account details updated successfully",
      data: updatedAccount,
    });
  } catch (err) {
    const error = err as Error;

    res.status(400).send({ message: error.message });
  }
}

export async function deleteUserAccountDetails(
  req: Request<{ accountId: string }>,
  res: Response,
) {
  try {
    const accountId = req.params.accountId;
    const userId = req.user!.id;

    if (!accountId) {
      throw new Error("Account ID is required");
    }

    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId,
      },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    if (account.isDefault) {
      const nextDefaultAccount = await prisma.account.findFirst({
        where: {
          userId,
          id: {
            not: accountId,
          },
          type: {
            notIn: [AccountType.Investment, AccountType.Credit_Card],
          },
        },
      });

      if (!nextDefaultAccount) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot delete the default account because no other eligible account is available",
        });
      }

      await prisma.$transaction(async (tx) => {
        await tx.account.update({
          where: {
            id: nextDefaultAccount.id,
          },
          data: {
            isDefault: true,
          },
        });

        await tx.account.delete({
          where: {
            id: accountId,
          },
        });
      });
    } else {
      await prisma.account.delete({
        where: {
          id: accountId,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Account deleted",
    });
  } catch (err) {
    const error = err as Error;

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}
