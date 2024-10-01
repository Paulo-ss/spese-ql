import { Context } from "../../../interfaces/context.interface";
import {
  ICreateCreditCard,
  ICreditCardResponse,
  IUpdateCreditCard,
} from "../../../interfaces/credit-card.interfaces";
import { ISuccess } from "../../../interfaces/success.interface";

export const creditCardMutations = {
  createCreditCard: async (
    _: any,
    { bank, closingDay, dueDay, limit, nickname }: ICreateCreditCard,
    { creditCardService }: Context
  ): Promise<ICreditCardResponse> => {
    const { creditCard, errors } = await creditCardService.create({
      bank,
      closingDay,
      dueDay,
      limit,
      nickname,
    });

    return { creditCard, errors };
  },
  updateCreditCard: async (
    _: any,
    {
      bank,
      closingDay,
      dueDay,
      limit,
      nickname,
      creditCardId,
    }: IUpdateCreditCard,
    { creditCardService }: Context
  ): Promise<ICreditCardResponse> => {
    const { creditCard, errors } = await creditCardService.update({
      creditCardId,
      bank,
      closingDay,
      dueDay,
      limit,
      nickname,
    });

    return { creditCard, errors };
  },
  deleteCreditCard: async (
    _: any,
    { creditCardId }: { creditCardId: number },
    { creditCardService }: Context
  ): Promise<ISuccess> => {
    const { success, errors } = await creditCardService.delete(creditCardId);

    return { success, errors };
  },
};
