import jwt, { JwtPayload } from "jsonwebtoken";
import prisma from "../config/prisma";
import { NextFunction, Request, Response } from "express";

async function userAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).send("Please login.");
    }

    const secret = process.env.JWT_SECRET_KEY;

    if (!secret) {
      throw new Error("JWT_SECRET_KEY is not configured");
    }

    const decodedObj = jwt.verify(token, secret) as JwtPayload;

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
    const error = err as Error;
    res.status(400).send("ERROR: " + error.message);
  }
}

export default userAuth;
