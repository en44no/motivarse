export type Currency = 'UYU' | 'USD';

export interface ExpensePayment {
  installmentNumber: number;
  amount: number;
  paidAt: number;
}

export interface Expense {
  id: string;
  coupleId: string;
  name: string;
  installmentPrice: number;
  totalInstallments: number;
  isFixedInstallment: boolean;
  currency: Currency;
  category?: string;
  card?: string;
  assignedTo: string; // userId or 'both'
  payments: ExpensePayment[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface ExpenseCard {
  id: string;
  coupleId: string;
  name: string;
  createdAt: number;
}

export interface ExpenseCategory {
  id: string;
  coupleId: string;
  label: string;
  emoji: string;
  createdBy: string;
  createdAt: number;
}
