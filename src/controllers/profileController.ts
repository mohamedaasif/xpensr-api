import { Response } from "express";
import { AuthRequest } from "../interfaces/auth.interface";

async function getProfile(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    res.send(user);
  } catch (err) {
    const error = err as Error;
    res.status(400).send("ERROR: " + error.message);
  }
}

export default getProfile;
