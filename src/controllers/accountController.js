const prisma = require("../config/prisma");

async function postAccountDetails(req, res) {
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
        userId: req.user.id,
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
          userId: req.user.id,
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
    res.status(400).send({ message: err.message });
  }
}

async function getUserAccountDetails(req, res) {
  try {
    const accountDetails = await prisma.account.findMany({
      where: { userId: req.user.id },
    });
    res.status(200).json({
      success: true,
      data: accountDetails,
    });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
}

async function updateUserAccountDetails(req, res) {
  try {
    const accountId = req.params.accountId;
    const { name, type, bankName, currency, isDefault, isArchived } = req.body;

    if (!accountId) {
      throw new Error("Account ID is required");
    }

    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: req.user.id,
      },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    const updateData = {};

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
          userId: req.user.id,
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
    res.status(400).send({ message: err.message });
  }
}

module.exports = {
  postAccountDetails,
  getUserAccountDetails,
  updateUserAccountDetails,
};
