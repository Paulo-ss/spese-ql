import { InvoiceStatus, Prisma, PrismaClient } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/library";
import {
  ICreateInvoice,
  IInvoiceResponse,
} from "../interfaces/invoice.interfaces";
import { isEmpty, isEnum } from "class-validator";
import { getInvoiceMonth } from "../utils/get-invoice-month.util";
import { getNextBusinessDay } from "../utils/get-next-business-day.util";
import { ISuccess } from "../interfaces/success.interface";
import { ExpenseService } from "./expense.service";
import { CreditCardService } from "./credit-card.service";

export class InvoiceService {
  constructor(
    private readonly prisma: PrismaClient<
      Prisma.PrismaClientOptions,
      never,
      DefaultArgs
    >
  ) {}

  public async findById(id: number): Promise<IInvoiceResponse> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { expense: true },
    });

    if (isEmpty(invoice)) {
      return { invoice: null, errors: [{ message: "Fatura não encontrada." }] };
    }

    return { invoice, errors: [] };
  }

  public async findByMonthAndCreditCard(
    creditCardId: number,
    closingDay: number,
    invoiceDate: Date
  ): Promise<IInvoiceResponse> {
    const { month, year } = getInvoiceMonth(closingDay, invoiceDate);
    const date = new Date(year, month, closingDay);

    const invoice = await this.prisma.invoice.findFirst({
      where: { credit_card_id: creditCardId, closing_date: date },
      include: { expense: true },
    });

    if (isEmpty(invoice)) {
      return {
        invoice: null,
        errors: [{ message: "Fatura não encontrada para esse mês." }],
      };
    }

    return { invoice, errors: [] };
  }

  public async create(inv: ICreateInvoice): Promise<IInvoiceResponse> {
    const { invoiceDate } = inv;

    const closingDay = inv.creditCard.closing_day;
    const dueDay = inv.creditCard.due_day;

    const { month, year } = getInvoiceMonth(closingDay, invoiceDate);

    const invoiceClosingDate = new Date(year, month);
    invoiceClosingDate.setDate(closingDay);

    const invoiceDueDate = new Date(year, month);

    // If the due day is smaller than the closing day, that means
    // that the invoice due day is on the next month
    if (dueDay < closingDay) {
      invoiceDueDate.setMonth(invoiceDueDate.getMonth() + 1);
    }

    invoiceDueDate.setDate(dueDay);

    if (isEmpty(inv.status) || !isEnum(inv.status, InvoiceStatus)) {
      return {
        invoice: null,
        errors: [{ message: "O status da fatura está inválido." }],
      };
    }

    try {
      const invoice = await this.prisma.invoice.create({
        data: {
          credit_card_id: inv.creditCard.id,
          current_price: inv.currentPrice,
          status: inv.status,
          closing_date: invoiceClosingDate,
          due_date: getNextBusinessDay(invoiceDueDate),
        },
        include: { expense: true },
      });

      return { invoice, errors: [] };
    } catch (error) {
      return { invoice: null, errors: [{ message: error.message }] };
    }
  }

  public async updatePrice(
    id: number,
    price: number
  ): Promise<IInvoiceResponse> {
    const { invoice, errors: invErrors } = await this.findById(id);

    if (invErrors.length > 0) {
      return { invoice: null, errors: invErrors };
    }

    if (invoice.status === InvoiceStatus.CLOSED) {
      return {
        invoice: null,
        errors: [{ message: "Fatura já está fechada." }],
      };
    }

    const priceDecimal = new Prisma.Decimal(price);
    const updatedInvoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        current_price: invoice.current_price.add(priceDecimal),
      },
      include: { expense: true },
    });

    return { invoice: updatedInvoice, errors: [] };
  }

  public async payInvoice(id: number): Promise<ISuccess> {
    const { invoice: invoiceToBePaid, errors: invErrors } = await this.findById(
      id
    );

    if (invErrors.length > 0) {
      return { success: null, errors: invErrors };
    }

    const { creditCard, errors: ccErrors } = await new CreditCardService(
      this.prisma
    ).findById(invoiceToBePaid.credit_card_id);

    if (ccErrors.length > 0) {
      return { success: null, errors: ccErrors };
    }

    await this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.PAID },
    });

    if (invoiceToBePaid.expense) {
      invoiceToBePaid.expense.forEach(async (expense) => {
        await new ExpenseService(this.prisma).payExpense(expense.id);
      });
    }

    const nextMonthInvoiceDate = new Date(invoiceToBePaid.closing_date);
    nextMonthInvoiceDate.setMonth(nextMonthInvoiceDate.getMonth() + 1);
    nextMonthInvoiceDate.setDate(nextMonthInvoiceDate.getDate() - 1);

    const { invoice: nextMonthInvoice } = await this.findByMonthAndCreditCard(
      creditCard.id,
      creditCard.closing_day,
      nextMonthInvoiceDate
    );

    if (!isEmpty(nextMonthInvoice)) {
      nextMonthInvoice.status = InvoiceStatus.OPENED_CURRENT;

      await this.prisma.invoice.update({
        where: { id: nextMonthInvoice.id },
        data: { status: InvoiceStatus.OPENED_CURRENT },
      });
    }

    return { success: { message: "Fatura paga!" }, errors: [] };
  }
}
