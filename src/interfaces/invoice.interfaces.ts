import { InvoiceStatus, Prisma, credit_card } from "@prisma/client";
import { IErrors } from "./errors.interface";

export interface ICreateInvoice {
  currentPrice: number;
  creditCard: credit_card;
  status: InvoiceStatus;
  invoiceDate: Date;
}

export interface IInvoiceResponse extends IErrors {
  invoice: Prisma.invoiceGetPayload<{ include: { expense: true } }> | null;
}
