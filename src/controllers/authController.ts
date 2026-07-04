import { Request, Response } from "express";
import { LoginBody, SignupBody } from "../interfaces/auth.interface";
import prisma from "../config/prisma";
import bcrypt from "bcrypt";
import { validatePassword, validateSignupData } from "../utils/validation";
import { getJWT } from "../utils/jwt";

export async function signup(req: Request<{}, {}, SignupBody>, res: Response) {
  try {
    validateSignupData(req.body);
    const { firstName, lastName, emailId, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: emailId,
        password: hashedPassword,
      },
    });
    const token = await getJWT(user?.id);

    res.cookie("token", token, {
      expires: new Date(Date.now() + 24 * 3600000), // 24h | 1d
    });

    res.status(200).json({
      success: true,
      message: "User Added successfully!",
      data: user,
    });
  } catch (err) {
    const error = err as Error;
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function login(req: Request<{}, {}, LoginBody>, res: Response) {
  try {
    const { emailId, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email: emailId } });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isPasswordValid = await validatePassword(user, password);
    if (isPasswordValid) {
      const token = await getJWT(user?.id);

      res.cookie("token", token, {
        expires: new Date(Date.now() + 24 * 3600000),
      });

      const { id, firstName, lastName, email, createdAt, updatedAt } = user;
      res.status(200).json({
        success: true,
        data: {
          id,
          firstName,
          lastName,
          emailId: email,
          createdAt,
          updatedAt,
        },
      });
    } else {
      throw new Error("Invalid credentials");
    }
  } catch (err) {
    const error = err as Error;

    res.status(400).json({ success: false, message: error.message });
  }
}

export async function logout(req: Request, res: Response) {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
  });
  res.send("Logout successful");
}
