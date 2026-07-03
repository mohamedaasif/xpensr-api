const jwt = require("jsonwebtoken");

async function getJWT(userId) {
  const token = await jwt.sign({ id: userId }, process.env.JWT_SECRET_KEY, {
    expiresIn: "1d",
  });
  return token;
}

module.exports = { getJWT };
