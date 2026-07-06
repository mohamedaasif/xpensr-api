import { Request, Response } from "express";

async function getProfile(req: Request, res: Response) {
  try {
    const user = req.user;
    res.send(user);
  } catch (err) {
    const error = err as Error;
    res.status(400).send("ERROR: " + error.message);
  }
}

export default getProfile;
