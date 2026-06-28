const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    // Owner of the account
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // User-defined account name
    // Examples: Cash, Salary Account, HDFC Savings, ICICI Credit Card
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    // Account type
    type: {
      type: String,
      enum: [
        "Cash",
        "Savings",
        "Current",
        "Credit Card",
        "Wallet",
        "Investment",
      ],
      required: true,
    },

    // Bank name (optional)
    // Required only for bank/credit card accounts
    bankName: {
      type: String,
      trim: true,
      default: null,
    },

    // Starting balance when account is created
    openingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Current balance
    // Update this whenever a transaction is added, edited, or deleted
    balance: {
      type: Number,
      default: 0,
    },

    // Currency
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },

    // Set as default account
    isDefault: {
      type: Boolean,
      default: false,
    },

    // Hide instead of deleting
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Account", accountSchema);
