import { PrismaClient } from '@prisma/client';

// Keep a single Prisma client instance in development to prevent connection exhaustion
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Export as both 'prisma' and 'db' so either import name works
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
export const db = prisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
