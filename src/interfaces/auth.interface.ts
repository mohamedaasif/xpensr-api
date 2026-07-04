import { Request } from "express";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
  };
}
