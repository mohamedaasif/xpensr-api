const Account = require("../models/account");

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

    const account = new Account({
      userId: req.user.id,
      name,
      type,
      bankName,
      openingBalance,
      balance: openingBalance,
      currency,
      isDefault,
      isArchived,
    });

    const accountDetails = await account.save();

    if (isDefault) {
      await Account.updateMany(
        { userId: req.user.id, _id: { $ne: accountDetails.id } },
        { $set: { isDefault: false } },
      );
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
    const accountDetails = await Account.find({ userId: req.user.id });
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
    const accId = req.params.id;
    const { name, type, bankName, currency, isDefault, isArchived } = req.body;

    if (!accId) {
      throw new Error("Account ID is required");
    }

    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (bankName !== undefined) updateData.bankName = bankName;
    if (currency !== undefined) updateData.currency = currency;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (isArchived !== undefined) updateData.isArchived = isArchived;

    const updateAccDetails = await Account.findOneAndUpdate(
      { _id: accId, userId: req.user.id },
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updateAccDetails) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    if (isDefault) {
      await Account.updateMany(
        { userId: req.user.id, _id: { $ne: accId } },
        { $set: { isDefault: false } },
      );
    }

    res.status(200).json({
      success: true,
      message: "Account details updated successfully",
      data: updateAccDetails,
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
