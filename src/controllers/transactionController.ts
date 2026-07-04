import { Request, Response } from "express";

export const addTransaction = (req: Request, res: Response) => {
  try {
  } catch (err) {
    const error = err as Error;
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
};

export const getAllTransactions = (req: Request, res: Response) => {
  try {
  } catch (err) {
    const error = err as Error;
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
};

export const updateTransaction = (req: Request, res: Response) => {
  try {
  } catch (err) {
    const error = err as Error;
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
};

export const deleteTransaction = (req: Request, res: Response) => {
  try {
  } catch (err) {
    const error = err as Error;
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
};
