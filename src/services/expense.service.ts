import {
  ExpenseCategory,
  ExpenseStatus,
  ExpenseType,
  InvoiceStatus,
  Prisma,
  PrismaClient,
  expense,
  invoice,
} from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/library";
import {
  ICreateExpense,
  IExpenseResponse,
  IFindExpensesFilters,
  IMultipleExpensesResponse,
} from "../interfaces/expense.interfaces";
import { isEmpty, isEnum, isNegative } from "class-validator";
import { ISuccess } from "../interfaces/success.interface";
import { CreditCardService } from "./credit-card.service";
import { InvoiceService } from "./invoice.service";
import { getInvoiceMonth } from "../utils/get-invoice-month.util";
import { TMessage } from "../types/message.type";

export class ExpenseService {
  constructor(
    private readonly prisma: PrismaClient<
      Prisma.PrismaClientOptions,
      never,
      DefaultArgs
    >
  ) {}

  public async findById(id: number): Promise<IExpenseResponse> {
    const expense = await this.prisma.expense.findUnique({ where: { id } });

    if (isEmpty(expense)) {
      return {
        expense: null,
        errors: [{ message: "Despesa não encontrada." }],
      };
    }

    return { expense, errors: [] };
  }

  public async findByFilters(
    filters: IFindExpensesFilters
  ): Promise<IMultipleExpensesResponse> {
    const [fromMonth, fromYear] = filters.fromMonth.split("-").map(Number);
    const fromDate = new Date(fromYear, fromMonth - 1);
    const lastDayOfTheMonth = new Date(fromYear, fromMonth, 0);

    let sqlString = `SELECT * FROM expense e LEFT JOIN credit_card cc ON cc.id = e.credit_card_id WHERE e.expense_date between ${fromDate} and ${lastDayOfTheMonth} `;

    if (filters.toMonth) {
      const [toMonth, toYear] = filters.toMonth.split("-").map(Number);

      sqlString = `SELECT * FROM expenses LEFT JOIN credit_card cc ON cc.id = e.credit_card_id e WHERE e.expense_date BETWEEN ${fromDate} AND ${new Date(
        toYear,
        toMonth
      )} `;
    }

    if (filters.category) {
      sqlString += `AND e.category = ${filters.category} `;
    }

    if (filters.name) {
      sqlString += `AND UPPER(e.name) = %${filters.name.toUpperCase()}% `;
    }

    if (filters.creditCardId) {
      sqlString += `AND cc.id = ${filters.creditCardId} `;
    }

    if (filters.priceRange) {
      const [min, max] = filters.priceRange;

      sqlString += `AND e.price BETWEEN ${min} AND ${max} `;
    }

    if (filters.status) {
      sqlString += `AND e.status = ${filters.status} `;
    }

    try {
      const expenses = await this.prisma.$queryRaw<expense[]>(
        Prisma.sql`${sqlString}`
      );

      return { expenses, errors: [] };
    } catch (error) {
      return { expenses: null, errors: [{ message: error }] };
    }
  }

  public async create(
    exp: ICreateExpense
  ): Promise<ISuccess | IExpenseResponse> {
    const {
      expenseType,
      name,
      price,
      category,
      creditCardId,
      installments,
      expenseDate,
    } = exp;

    const errors: TMessage[] = [];

    if (isEmpty(name)) {
      errors.push({ message: "Digite um nome para a despesa." });
    }

    if (isEmpty(price) || isNaN(price)) {
      errors.push({ message: "Digite um preço válido para a despesa." });
    }

    if (
      !isEmpty(installments) &&
      (isNaN(installments) ||
        isNegative(installments) ||
        Number(installments) === 1)
    ) {
      errors.push({ message: "A parcela deve ser um número acima de 0." });
    }

    if (isEmpty(expenseType) || !isEnum(expenseType, ExpenseType)) {
      errors.push({ message: "Tipo de despesa inválida." });
    }

    if (isEmpty(category) || !isEnum(category, ExpenseCategory)) {
      errors.push({ message: "Categoria de despesa inválida." });
    }

    if (errors.length > 0) {
      return { expense: null, errors };
    }

    const creditCardService = new CreditCardService(this.prisma);
    const { creditCard } = creditCardId
      ? await creditCardService.findById(creditCardId)
      : { creditCard: null };

    let invoice: invoice = null;
    const invoices: invoice[] = [];

    if (creditCard) {
      const today = new Date();
      const invoiceService = new InvoiceService(this.prisma);

      const { invoice: searchedInvoice } =
        await invoiceService.findByMonthAndCreditCard(
          creditCardId,
          creditCard.closing_day,
          new Date(expenseDate)
        );
      invoice = searchedInvoice;

      if (isEmpty(invoice)) {
        const { month, year } = getInvoiceMonth(
          creditCard.closing_day,
          new Date(expenseDate)
        );

        let invoiceStatus: InvoiceStatus = InvoiceStatus.PAID;

        if (month > today.getMonth() || year > today.getFullYear()) {
          invoiceStatus = InvoiceStatus.OPENED_FUTURE;
        }

        if (
          (month - today.getMonth() === 1 ||
            (month === today.getMonth() &&
              today.getDate() < creditCard.closing_day)) &&
          year === today.getFullYear()
        ) {
          invoiceStatus = InvoiceStatus.OPENED_CURRENT;
        }

        const { invoice: createdInvoice } = await invoiceService.create({
          creditCard,
          currentPrice: price,
          invoiceDate: new Date(expenseDate),
          status: invoiceStatus,
        });

        invoice = createdInvoice;
      } else {
        const id = invoice.id;
        const currentPrice = invoice.current_price;

        const { invoice: updatedInvoice } = await invoiceService.updatePrice(
          id,
          parseFloat(String(currentPrice)) + price
        );
        invoice = updatedInvoice;
      }

      invoices.push(invoice);

      if (installments) {
        for (let i = 1; i <= installments - 1; i++) {
          const previousInvoice = invoices[i - 1];
          const nextInvoiceDate = new Date(previousInvoice.closing_date);
          nextInvoiceDate.setMonth(nextInvoiceDate.getMonth() + 1);

          const { invoice } = await invoiceService.findByMonthAndCreditCard(
            creditCardId,
            creditCard.closing_day,
            new Date(previousInvoice.closing_date)
          );
          let installmentInvoice = invoice;

          if (isEmpty(installmentInvoice)) {
            const { month, year } = getInvoiceMonth(
              creditCard.closing_day,
              new Date(previousInvoice.closing_date)
            );

            let invoiceStatus: InvoiceStatus = InvoiceStatus.PAID;
            if (month > today.getMonth() || year > today.getFullYear()) {
              invoiceStatus = InvoiceStatus.OPENED_FUTURE;
            }

            if (
              month - today.getMonth() === 1 &&
              year === today.getFullYear()
            ) {
              invoiceStatus = InvoiceStatus.OPENED_CURRENT;
            }

            const { invoice } = await invoiceService.create({
              creditCard,
              currentPrice: price,
              invoiceDate: new Date(
                nextInvoiceDate.getFullYear(),
                nextInvoiceDate.getMonth()
              ),
              status: invoiceStatus,
            });
            installmentInvoice = invoice;
          } else {
            const id = installmentInvoice.id;
            const currentPrice = installmentInvoice.current_price;

            const { invoice } = await invoiceService.updatePrice(
              id,
              parseFloat(String(currentPrice)) + price
            );
            installmentInvoice = invoice;
          }

          invoices.push(installmentInvoice);
        }

        const expenses: expense[] = [];
        for (let i = 1; i <= installments; i++) {
          const invoiceDate = new Date(invoices[i - 1].closing_date);

          expenses.push(
            await this.prisma.expense.create({
              data: {
                expense_type: expenseType,
                status: ExpenseStatus.PENDING,
                name,
                price,
                credit_card_id: creditCard.id,
                category,
                invoice_id: invoices[i - 1].id,
                installments_number: i,
                expense_date: invoiceDate,
              },
            })
          );
        }

        return {
          success: {
            message: `Despesa criada com sucesso em ${installments} parcelas.`,
          },
          errors: [],
        };
      }
    }

    const expense = await this.prisma.expense.create({
      data: {
        expense_type: expenseType,
        status: ExpenseStatus.PENDING,
        name,
        price,
        credit_card_id: creditCard?.id,
        category,
        invoice_id: invoices[0]?.id,
        installments_number: null,
        expense_date: new Date(expenseDate),
      },
    });

    return { expense, errors: [] };
  }

  public async payExpense(id: number): Promise<ISuccess> {
    const { expense, errors } = await this.findById(id);

    if (errors.length > 0) {
      return { success: null, errors };
    }

    expense.status = ExpenseStatus.PAID;

    await this.prisma.expense.update({ where: { id }, data: { ...expense } });

    return { success: { message: "Despesa paga!" }, errors: [] };
  }

  public async delete(id: number): Promise<ISuccess> {
    const { errors } = await this.findById(id);

    if (errors.length > 0) {
      return { success: null, errors };
    }

    await this.prisma.expense.delete({ where: { id } });

    return {
      success: { message: "Despesa deletada!" },
      errors: [],
    };
  }
}
