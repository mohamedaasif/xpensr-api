import { AccountType } from "@prisma/client";

export interface AccountBody {
  name: string;
  type: AccountType;
  bankName: string;
  openingBalance: number;
  currency: string;
  isDefault: boolean;
  isArchived: boolean;
}

export interface UpdateAccountBody {
  name?: string;
  type?: AccountType;
  bankName?: string;
  currency?: string;
  isDefault?: boolean;
  isArchived?: boolean;
}
