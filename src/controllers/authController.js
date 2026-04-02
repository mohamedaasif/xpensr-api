const User = require("../models/user");
const { validateSignupData } = require("../utils/validation");
const bcrypt = require("bcrypt");

async function signup(req, res) {
  try {
    validateSignupData(req);
    const { firstName, lastName, emailId, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    // create a new instance for the user model
    const user = new User({
      firstName,
      lastName,
      emailId,
      password: hashedPassword,
    });

    const savedUser = await user.save();
    const token = await savedUser.getJWT();

    res.cookie("token", token, {
      expires: new Date(Date.now() + 24 * 3600000), // 24h | 1d
    });

    res
      .status(200)
      .json({
        success: true,
        message: "User Added successfully!",
        data: savedUser,
      });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function login(req, res) {
  try {
    const { emailId, password } = req.body;
    const user = await User.findOne({ emailId: emailId });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isPasswordValid = await user.validatePassword(password);
    if (isPasswordValid) {
      const token = await user.getJWT();

      res.cookie("token", token, {
        expires: new Date(Date.now() + 24 * 3600000),
      });

      const { _id, firstName, lastName, emailId, createdAt, updatedAt } = user;
      res.status(200).json({
        success: true,
        data: {
          _id,
          firstName,
          lastName,
          emailId,
          createdAt,
          updatedAt,
        },
      });
    } else {
      throw new Error("Invalid credentials");
    }
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function logout(req, res) {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
  });
  res.send("Logout successful");
}

module.exports = { signup, login, logout };
