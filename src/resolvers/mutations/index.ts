import { creditCardMutations } from "./credit-card/credit-card.mutation";
import { expenseMutations } from "./expense/expense.mutation";
import { invoiceMutations } from "./invoice/invoice.mutation";
import { subscriptionMutations } from "./subscription/subscription.mutation";

export const Mutation = {
  ...creditCardMutations,
  ...expenseMutations,
  ...subscriptionMutations,
  ...invoiceMutations,
};
