import { Context } from "../../../interfaces/context.interface";
import {
  ICreditCardResponse,
  IMultipleCreditcardsResponse,
} from "../../../interfaces/credit-card.interfaces";

export const creditCardQuery = {
  findCreditCardById: async (
    _: any,
    { id }: { id: number },
    { creditCardService }: Context
  ): Promise<ICreditCardResponse> => {
    const { errors, creditCard } = await creditCardService.findById(id);

    return { errors, creditCard };
  },
  findAllCreditCards: async (
    _: any,
    __: any,
    { creditCardService }: Context
  ): Promise<IMultipleCreditcardsResponse> => {
    const { errors, creditCards } = await creditCardService.findAll();

    return { errors, creditCards };
  },
};
