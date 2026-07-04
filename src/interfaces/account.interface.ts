import { AccountType } from "@prisma/client";
import { Request } from "express";

export interface AccountDetailsRequest extends Request {
  body: {
    name: string;
    type: AccountType;
    bankName: string;
    openingBalance: number;
    currency: string;
    isDefault: boolean;
    isArchived: boolean;
  };
  user: {
    id: string;
  };
}

export interface UpdateAccountBody {
  name?: string;
  type?: AccountType;
  bankName?: string;
  currency?: string;
  isDefault?: boolean;
  isArchived?: boolean;
}
