import { subscription } from "@prisma/client";
import { IErrors } from "./errors.interface";

export interface ICreateSubscription {
  name: string;
  price: number;
  creditCardId: number;
}

export interface IUpdateSubscription extends ICreateSubscription {
  id: number;
}

export interface ISubscriptionResponse extends IErrors {
  subscription: subscription | null;
}
