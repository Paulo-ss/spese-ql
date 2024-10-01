import { Context } from "../../../interfaces/context.interface";
import { ISuccess } from "../../../interfaces/success.interface";

export const invoiceMutations = {
  payInvoice: async (
    _: any,
    { invoiceId }: { invoiceId: number },
    { invoiceService }: Context
  ): Promise<ISuccess> => {
    const { success, errors } = await invoiceService.payInvoice(invoiceId);

    return { success, errors };
  },
};
