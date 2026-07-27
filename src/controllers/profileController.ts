import { Request, Response } from "express";
import prisma from "../config/prisma";
import { UpdateUserDto } from "../interfaces/auth.interface";

export async function getProfile(req: Request, res: Response) {
  try {
    const user = req.user;
    res.send(user);
  } catch (err) {
    const error = err as Error;
    res.status(400).send("ERROR: " + error.message);
  }
}

export async function updateProfile(req: Request, res: Response) {
  try {
    const user = req.user;
    const { firstName, lastName, phone, dob } = req.body;

    const userData = await prisma.user.findUnique({
      where: {
        id: user!.id,
        email: user?.email,
      },
    });

    if (!userData) throw new Error("User does not exist");

    const updateData: UpdateUserDto = {};

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (dob !== undefined) {
      const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;

      if (!regex.test(dob)) {
        return res.status(400).json({
          success: false,
          message: "DOB must be in MM/DD/YYYY format.",
        });
      }

      const [month, day, year] = dob.split("/").map(Number);
      updateData.dob = new Date(Date.UTC(year, month - 1, day));
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: user!.id,
      },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dob: true,
        countryCode: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.send({ success: true, data: updatedUser });
  } catch (err) {
    const error = err as Error;
    res.status(400).send("ERROR: " + error.message);
  }
}
