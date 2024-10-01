import { Context } from "../../../interfaces/context.interface";
import { IInvoiceResponse } from "../../../interfaces/invoice.interfaces";

export const invoiceQuery = {
  findInvoiceById: async (
    _: any,
    { id }: { id: number },
    { invoiceService }: Context
  ): Promise<IInvoiceResponse> => {
    const { errors, invoice } = await invoiceService.findById(id);

    return { errors, invoice };
  },
};
