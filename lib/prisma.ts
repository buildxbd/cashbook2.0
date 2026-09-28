import { PrismaClient as PrismaClientNode } from '@prisma/client';

type PrismaClientType = PrismaClientNode;

/**
 * Creates a Prisma Client instance compatible with both Edge runtime
 * (Cloudflare Pages / Workers) and standard Node.js environments.
 */
function createPrismaClient(): PrismaClientType {
  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime (Cloudflare Pages / Workers)
    // Uses @prisma/client/edge designed for Accelerate/Data Proxy/Hyperdrive
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient: PrismaClientEdge } = require('@prisma/client/edge');
    return new PrismaClientEdge({
      log: ['error'],
    });
  }

  // Standard Node.js runtime (local dev server, standard SSR)
  return new PrismaClientNode({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientType | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
