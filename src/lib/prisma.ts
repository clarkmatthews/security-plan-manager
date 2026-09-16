import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function hasChangeLog(client: PrismaClient) {
  return typeof (client as PrismaClient & { assessmentChange?: { createMany?: unknown } })
    .assessmentChange?.createMany === "function";
}

if (globalForPrisma.prisma && !hasChangeLog(globalForPrisma.prisma)) {
  void globalForPrisma.prisma.$disconnect();
  globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
