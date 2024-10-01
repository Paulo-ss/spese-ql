import { Prisma, PrismaClient } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/library";
import {
  ICreateSubscription,
  ISubscriptionResponse,
  IUpdateSubscription,
} from "../interfaces/subscription.interfaces";
import { isEmpty } from "class-validator";
import { TMessage } from "../types/message.type";
import { CreditCardService } from "./credit-card.service";
import { ISuccess } from "../interfaces/success.interface";

export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaClient<
      Prisma.PrismaClientOptions,
      never,
      DefaultArgs
    >
  ) {}

  public async findById(id: number): Promise<ISubscriptionResponse> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (isEmpty(subscription)) {
      return {
        subscription: null,
        errors: [{ message: "Inscrição não encontrada" }],
      };
    }

    return { subscription, errors: [] };
  }

  public async create(
    sub: ICreateSubscription
  ): Promise<ISubscriptionResponse> {
    const errors: TMessage[] = [];

    if (isEmpty(sub.creditCardId) || isNaN(sub.creditCardId)) {
      errors.push({ message: "Infome um cartão de crédito válido." });
    }

    if (isEmpty(sub.price) || isNaN(sub.price)) {
      errors.push({ message: "Infome um preço válido." });
    }

    if (isEmpty(sub.name)) {
      errors.push({ message: "Infome um nome." });
    }

    if (errors.length > 0) {
      return { subscription: null, errors };
    }

    const { errors: ccErros } = await new CreditCardService(
      this.prisma
    ).findById(sub.creditCardId);

    if (ccErros.length > 0) {
      return { subscription: null, errors: ccErros };
    }

    const subscription = await this.prisma.subscription.create({
      data: {
        credit_card_id: sub.creditCardId,
        price: sub.price,
        name: sub.name,
      },
    });

    return { subscription, errors };
  }

  public async update(
    sub: IUpdateSubscription
  ): Promise<ISubscriptionResponse> {
    const { subscription, errors: subErros } = await this.findById(sub.id);

    if (subErros.length > 0) {
      return { subscription: null, errors: subErros };
    }

    const errors: TMessage[] = [];

    if (!isEmpty(sub.name)) {
      subscription.name = sub.name;
    }

    if (!isEmpty(sub.price)) {
      if (isNaN(sub.price)) {
        errors.push({
          message: "Infome um preço válido.",
        });
      } else {
        subscription.price = new Prisma.Decimal(sub.price);
      }
    }

    if (errors.length > 0) {
      return { subscription: null, errors };
    }

    const updatedSubscription = await this.prisma.subscription.update({
      where: { id: sub.id },
      data: { ...subscription },
    });

    return { subscription: updatedSubscription, errors: [] };
  }

  public async delete(id: number): Promise<ISuccess> {
    const { errors } = await this.findById(id);

    if (errors.length > 0) {
      return { success: null, errors };
    }

    await this.prisma.subscription.delete({ where: { id } });

    return {
      success: { message: "Assinatura deletada com sucesso." },
      errors: [],
    };
  }
}
