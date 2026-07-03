const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

async function userAuth(req, res, next) {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).send("Please login.");
    }

    const decodedObj = await jwt.verify(token, process.env.JWT_SECRET_KEY);

    const { id } = decodedObj;

    const user = await prisma.user.findUnique({
      where: { id: id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
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
