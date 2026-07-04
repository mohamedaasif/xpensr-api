import { User } from "@prisma/client";
import validator from "validator";
import bcrypt from "bcrypt";

export const validateSignupData = (data: {
  firstName: string;
  lastName: string;
  emailId: string;
  password: string;
}) => {
  const { firstName, lastName, emailId, password } = data;
  if (!firstName || !lastName) {
    throw new Error("Name is not valid!");
  } else if (!validator.isEmail(emailId)) {
    throw new Error("Email is not valid!");
  } else if (!validator.isStrongPassword(password)) {
    throw new Error("Please enter a strong password!");
  }
};

export async function validatePassword(
  user: User,
  passwordInputByUser: string,
) {
  const hashedPassword = user.password;
  const isPasswordValid = await bcrypt.compare(
    passwordInputByUser,
    hashedPassword,
  );
  return isPasswordValid;
}
