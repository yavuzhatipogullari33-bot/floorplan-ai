import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

function getDatabaseUrl(): string {
  // If custom external database URL is provided (e.g. Postgres / MySQL)
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('dev.db')) {
    return process.env.DATABASE_URL;
  }

  // On Vercel serverless, /var/task is read-only.
  // We copy the bundled sqlite db to /tmp/dev.db which allows reads and writes.
  if (process.env.VERCEL) {
    const tmpDbPath = '/tmp/dev.db';
    if (!fs.existsSync(tmpDbPath)) {
      const candidates = [
        path.join(process.cwd(), 'prisma', 'dev.db'),
        path.join(process.cwd(), 'dev.db'),
        '/var/task/prisma/dev.db',
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          try {
            fs.copyFileSync(p, tmpDbPath);
            console.log(`Copied database from ${p} to ${tmpDbPath}`);
            break;
          } catch (err) {
            console.error('Failed to copy db to /tmp:', err);
          }
        }
      }
    }
    return `file:${tmpDbPath}`;
  }

  // Local development: resolve absolute path to prisma/dev.db
  const localDb = path.resolve(process.cwd(), 'prisma', 'dev.db').replace(/\\/g, '/');
  return `file:${localDb}`;
}

const dbUrl = getDatabaseUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

