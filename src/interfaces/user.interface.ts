import { Request } from "express";

export interface LoginRequest extends Request {
  body: {
    emailId: string;
    password: string;
  };
}
