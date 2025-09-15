import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

console.log('🔥 File database.ts được load!');

declare global {
  // eslint-disable-next-line no-var
  var __db: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
    datasources: {
      db: {
        url: process.env.DATABASE_URL + ';charset=utf8;',
      },
    },
  });
} else {
  if (!global.__db) {
    global.__db = new PrismaClient({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
      datasources: {
        db: {
          url: process.env.DATABASE_URL + ';charset=utf8;',
        },
      },
    });
  }
  prisma = global.__db;
}

// Log database queries in development
if (process.env.NODE_ENV !== 'production') {
  prisma.$on('query', e => {
    logger.debug('Query: ' + e.query);
    logger.debug('Params: ' + e.params);
    logger.debug('Duration: ' + e.duration + 'ms');
  });
}

prisma.$on('error', e => {
  logger.error('Database Error:', e);
});

prisma.$on('warn', e => {
  logger.warn('Database Warning:', e);
});

// Test database connection
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('🗄️  Kết nối database thành công');
  } catch (error) {
    logger.error('❌ Lỗi kết nối database:', error);
    process.exit(1);
  }
};

// Graceful shutdown
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('🔌 Ngắt kết nối database thành công');
  } catch (error) {
    logger.error('❌ Lỗi ngắt kết nối database:', error);
  }
};

export { prisma };
export default prisma;
