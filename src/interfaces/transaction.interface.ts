import { PaymentType, TransactionType } from "@prisma/client";

export interface TransactionBody {
  accountId: string;
  toAccountId?: string;
  type: TransactionType;
  amount: number;
  description: string;
  notes?: string;
  transactionDate: Date;
  paymentMethod: PaymentType;
  referenceNo?: string;
  location?: string;
  isRecurring: boolean;
}

export interface UpdateTransactionBody {
  type?: TransactionType;
  accountId?: string;
  toAccountId?: string | null;
  amount?: number;
  description?: string;
  notes?: string;
  transactionDate?: Date;
  paymentMethod?: PaymentType;
  referenceNo?: string;
  location?: string;
  isRecurring?: boolean;
}
