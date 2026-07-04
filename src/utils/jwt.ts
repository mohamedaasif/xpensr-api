import jwt, { JwtPayload } from "jsonwebtoken";

export async function getJWT(userId: string) {
  const secret = process.env.JWT_SECRET_KEY;

  if (!secret) {
    throw new Error("JWT_SECRET_KEY is not configured");
  }

  const token = await jwt.sign({ id: userId }, secret, {
    expiresIn: "1d",
  });
  return token;
}
