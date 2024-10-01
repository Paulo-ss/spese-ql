import { Bank, Prisma, PrismaClient } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/library";
import {
  ICreateCreditCard,
  ICreditCardResponse,
  IMultipleCreditcardsResponse,
  IUpdateCreditCard,
} from "../interfaces/credit-card.interfaces";
import { isEmpty, isEnum, isNegative } from "class-validator";
import { TMessage } from "../types/message.type";
import { ISuccess } from "../interfaces/success.interface";

export class CreditCardService {
  constructor(
    private readonly prisma: PrismaClient<
      Prisma.PrismaClientOptions,
      never,
      DefaultArgs
    >
  ) {}

  public async findById(creditCardId: number): Promise<ICreditCardResponse> {
    const errors: TMessage[] = [];

    if (isEmpty(creditCardId) || isNaN(creditCardId)) {
      errors.push({ message: "Informe um ID válido." });
    }

    if (errors.length > 0) {
      return { creditCard: null, errors };
    }

    const creditCard = await this.prisma.credit_card.findUnique({
      where: { id: creditCardId },
      include: { expense: true, invoice: true, subscription: true },
    });

    if (isEmpty(creditCard)) {
      return {
        creditCard: null,
        errors: [{ message: "Cartão de crédito não encontrado." }],
      };
    }

    return { creditCard, errors: [] };
  }

  public async findAll(): Promise<IMultipleCreditcardsResponse> {
    return {
      creditCards: await this.prisma.credit_card.findMany(),
      errors: [],
    };
  }

  public async create(cc: ICreateCreditCard): Promise<ICreditCardResponse> {
    const errors: TMessage[] = [];

    if (isEmpty(cc.nickname)) {
      errors.push({ message: "Digite um apelido para o cartão." });
    }

    if (isEmpty(cc.bank) || !isEnum(cc.bank, Bank)) {
      errors.push({
        message: "O banco deve ser NuBank, Inter, Itau ou Bradesco.",
      });
    }

    if (isEmpty(cc.closingDay) || isNaN(cc.closingDay)) {
      errors.push({
        message: "O dia de fechamento deve ser um número",
      });
    }

    if (isEmpty(cc.dueDay) || isNaN(cc.dueDay)) {
      errors.push({
        message: "O dia de vencimento deve ser um número",
      });
    }

    if (isEmpty(cc.limit) || isNaN(cc.limit) || isNegative(cc.limit)) {
      errors.push({
        message: "O limite deve ser um número maior que zero.",
      });
    }

    if (errors.length > 0) {
      return { creditCard: null, errors };
    }

    const creditCard = await this.prisma.credit_card.create({
      data: {
        bank: cc.bank,
        closing_day: cc.closingDay,
        due_day: cc.dueDay,
        limit: cc.limit,
        nickname: cc.nickname,
      },
    });

    return { creditCard, errors: [] };
  }

  public async update(cc: IUpdateCreditCard): Promise<ICreditCardResponse> {
    const { creditCard, errors: creditCardErrors } = await this.findById(
      cc.creditCardId
    );

    if (creditCardErrors.length > 0) {
      return { creditCard: null, errors: creditCardErrors };
    }

    const errors: TMessage[] = [];

    if (!isEmpty(cc.bank)) {
      if (!isEnum(cc.bank, Bank)) {
        errors.push({
          message: "O banco deve ser NuBank, Inter, Itau ou Bradesco.",
        });
      } else {
        creditCard.bank = cc.bank;
      }
    }

    if (!isEmpty(cc.closingDay)) {
      if (isNaN(cc.closingDay)) {
        errors.push({
          message: "O dia de fechamento deve ser um número",
        });
      } else {
        creditCard.closing_day = cc.closingDay;
      }
    }

    if (!isEmpty(cc.dueDay)) {
      if (isNaN(cc.dueDay)) {
        errors.push({
          message: "O dia de vencimento deve ser um número",
        });
      } else {
        creditCard.due_day = cc.dueDay;
      }
    }

    if (!isEmpty(cc.limit)) {
      if (isNaN(cc.limit) || isNegative(cc.limit)) {
        errors.push({
          message: "O limite deve ser um número maior que zero.",
        });
      } else {
        creditCard.limit = new Prisma.Decimal(cc.limit);
      }
    }

    if (errors.length > 0) {
      return { creditCard: null, errors };
    }

    const updatedCreditCard = await this.prisma.credit_card.update({
      where: { id: cc.creditCardId },
      data: { ...creditCard },
    });

    return { creditCard: updatedCreditCard, errors: [] };
  }

  public async delete(creditCardId: number): Promise<ISuccess> {
    const { errors: creditCardErrors } = await this.findById(creditCardId);

    if (creditCardErrors.length > 0) {
      return { success: null, errors: creditCardErrors };
    }

    await this.prisma.credit_card.delete({ where: { id: creditCardId } });

    return {
      success: { message: "Cartão de crédito deletado com sucesso." },
      errors: [],
    };
  }
}
