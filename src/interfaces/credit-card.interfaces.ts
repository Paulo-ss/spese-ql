import { Bank, credit_card } from "@prisma/client";
import { IErrors } from "./errors.interface";

export interface ICreateCreditCard {
  nickname: string;
  bank: Bank;
  limit: number;
  closingDay: number;
  dueDay: number;
}

export interface IUpdateCreditCard {
  creditCardId: number;
  nickname?: string;
  bank?: Bank;
  limit?: number;
  closingDay?: number;
  dueDay?: number;
}

export interface ICreditCardResponse extends IErrors {
  creditCard: credit_card | null;
}

export interface IMultipleCreditcardsResponse extends IErrors {
  creditCards: credit_card[] | null;
}
