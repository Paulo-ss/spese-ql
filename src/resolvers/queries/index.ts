import { creditCardQuery } from "./credit-card/credit-card.query";
import { expenseQuery } from "./expense/expense.query";
import { invoiceQuery } from "./invoice/invoice.query";
import { subscriptionQuery } from "./subscription/subscription.query";

export const Query = {
  ...creditCardQuery,
  ...subscriptionQuery,
  ...invoiceQuery,
  ...expenseQuery,
};
