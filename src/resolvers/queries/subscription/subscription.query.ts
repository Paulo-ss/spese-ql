import { Context } from "../../../interfaces/context.interface";
import { ISubscriptionResponse } from "../../../interfaces/subscription.interfaces";

export const subscriptionQuery = {
  findSubscriptionById: async (
    _: any,
    { id }: { id: number },
    { subscriptionService }: Context
  ): Promise<ISubscriptionResponse> => {
    const { errors, subscription } = await subscriptionService.findById(id);

    return { errors, subscription };
  },
};
