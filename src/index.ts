import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { gql } from "graphql-tag";
import { Query } from "./resolvers/queries";
import { Mutation } from "./resolvers/mutations";
import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";
import { Context } from "./interfaces/context.interface";
import { CreditCardService } from "./services/credit-card.service";
import { InvoiceService } from "./services/invoice.service";
import { SubscriptionService } from "./services/subscription.service";
import { ExpenseService } from "./services/expense.service";

const typeDefs = gql(
  readFileSync("./src/schema/schema.graphql", { encoding: "utf-8" })
);

const prismaClient = new PrismaClient();

const server = new ApolloServer<Context>({
  typeDefs,
  resolvers: { Query, Mutation },
});

const { url } = await startStandaloneServer(server, {
  context: async () => {
    return {
      creditCardService: new CreditCardService(prismaClient),
      invoiceService: new InvoiceService(prismaClient),
      subscriptionService: new SubscriptionService(prismaClient),
      expenseService: new ExpenseService(prismaClient),
    };
  },
  listen: { port: 4000 },
});

console.log(`Server ready at: ${url}`);
