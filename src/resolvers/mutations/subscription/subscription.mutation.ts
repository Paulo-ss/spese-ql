import { Context } from "../../../interfaces/context.interface";
import {
  ICreateSubscription,
  ISubscriptionResponse,
  IUpdateSubscription,
} from "../../../interfaces/subscription.interfaces";
import { ISuccess } from "../../../interfaces/success.interface";

export const subscriptionMutations = {
  createSubscription: async (
    _: any,
    { creditCardId, name, price }: ICreateSubscription,
    { subscriptionService }: Context
  ): Promise<ISubscriptionResponse> => {
    const { subscription, errors } = await subscriptionService.create({
      creditCardId,
      name,
      price,
    });

    return { subscription, errors };
  },
  updateSubscription: async (
    _: any,
    { creditCardId, id, name, price }: IUpdateSubscription,
    { subscriptionService }: Context
  ): Promise<ISubscriptionResponse> => {
    const { subscription, errors } = await subscriptionService.update({
      creditCardId,
      id,
      name,
      price,
    });

    return { subscription, errors };
  },
  deleteSubscription: async (
    _: any,
    { subscriptionId }: { subscriptionId: number },
    { subscriptionService }: Context
  ): Promise<ISuccess> => {
    const { success, errors } = await subscriptionService.delete(
      subscriptionId
    );

    return { success, errors };
  },
};
