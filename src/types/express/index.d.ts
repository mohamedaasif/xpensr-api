import { AuthUser } from "../../interfaces/auth.interface";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
