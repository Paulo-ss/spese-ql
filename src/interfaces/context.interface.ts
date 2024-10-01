import { CreditCardService } from "../services/credit-card.service";
import { ExpenseService } from "../services/expense.service";
import { InvoiceService } from "../services/invoice.service";
import { SubscriptionService } from "../services/subscription.service";

export interface Context {
  creditCardService: CreditCardService;
  invoiceService: InvoiceService;
  subscriptionService: SubscriptionService;
  expenseService: ExpenseService;
}
