import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ["error"],
});

globalForPrisma.prisma = prisma;

export default prisma;
