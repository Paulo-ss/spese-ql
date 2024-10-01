import {
  ExpenseCategory,
  ExpenseStatus,
  ExpenseType,
  expense,
} from "@prisma/client";
import { IErrors } from "./errors.interface";

export interface ICreateExpense {
  creditCardId?: number;
  expenseType: ExpenseType;
  installments?: number;
  name: string;
  price: number;
  category?: ExpenseCategory;
  expenseDate: string;
}

export interface IFindExpensesFilters {
  fromMonth: string;
  toMonth?: string;
  category?: ExpenseCategory;
  name?: string;
  priceRange?: number[];
  status?: ExpenseStatus;
  creditCardId?: number;
}

export interface IExpenseResponse extends IErrors {
  expense: expense | null;
}

export interface IMultipleExpensesResponse extends IErrors {
  expenses: expense[] | null;
}
