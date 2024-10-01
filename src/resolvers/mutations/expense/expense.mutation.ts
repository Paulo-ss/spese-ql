import { Context } from "../../../interfaces/context.interface";
import {
  ICreateExpense,
  IExpenseResponse,
} from "../../../interfaces/expense.interfaces";
import { ISuccess } from "../../../interfaces/success.interface";

export const expenseMutations = {
  createExpense: async (
    _: any,
    {
      creditCardId,
      name,
      price,
      expenseDate,
      expenseType,
      category,
      installments,
    }: ICreateExpense,
    { expenseService }: Context
  ): Promise<IExpenseResponse | ISuccess> => {
    const result = await expenseService.create({
      creditCardId,
      name,
      price,
      expenseDate,
      expenseType,
      category,
      installments,
    });

    return result;
  },
  payExpense: async (
    _: any,
    { expenseId }: { expenseId: number },
    { expenseService }: Context
  ): Promise<ISuccess> => {
    const { success, errors } = await expenseService.payExpense(expenseId);

    return { success, errors };
  },
  deleteExpense: async (
    _: any,
    { expenseId }: { expenseId: number },
    { expenseService }: Context
  ): Promise<ISuccess> => {
    const { success, errors } = await expenseService.delete(expenseId);

    return { success, errors };
  },
};
