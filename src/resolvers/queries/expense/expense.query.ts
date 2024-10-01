import { Context } from "../../../interfaces/context.interface";
import {
  IExpenseResponse,
  IFindExpensesFilters,
  IMultipleExpensesResponse,
} from "../../../interfaces/expense.interfaces";

export const expenseQuery = {
  findExpenseById: async (
    _: any,
    { id }: { id: number },
    { expenseService }: Context
  ): Promise<IExpenseResponse> => {
    const { errors, expense } = await expenseService.findById(id);

    return { errors, expense };
  },
  findExpenseByFilters: async (
    _: any,
    {
      fromMonth,
      category,
      creditCardId,
      name,
      priceRange,
      status,
      toMonth,
    }: IFindExpensesFilters,
    { expenseService }: Context
  ): Promise<IMultipleExpensesResponse> => {
    const { errors, expenses } = await expenseService.findByFilters({
      fromMonth,
      category,
      creditCardId,
      name,
      priceRange,
      status,
      toMonth,
    });

    return { errors, expenses };
  },
};
