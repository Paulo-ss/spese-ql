import { TMessage } from "../types/message.type";
import { IErrors } from "./errors.interface";

export interface ISuccess extends IErrors {
  success: TMessage | null;
}
