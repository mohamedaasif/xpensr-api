const jwt = require("jsonwebtoken");
const User = require("../models/user");

async function userAuth(req, res, next) {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).send("Please login.");
    }

    const decodedObj = await jwt.verify(token, process.env.JWT_SECRET_KEY);

    const { _id } = decodedObj;

    const user = await User.findById(_id).select("-password -__v"); // excluding password and __v field
    if (!user) {
      throw new Error("User not found");
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
}

module.exports = { userAuth };
