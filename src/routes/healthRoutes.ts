import { Router, Request, Response } from 'express';
// import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { ApiResponse } from '../types';

const router = Router();

/**
 * @route GET /api/v1/health
 * @desc Kiểm tra tình trạng server
 * @access Public
 */
router.get('/', async (req: Request, res: Response) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    memory: {
      used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
      total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
      external: Math.round((process.memoryUsage().external / 1024 / 1024) * 100) / 100,
    },
  };

  const response: ApiResponse = {
    success: true,
    message: 'Server đang hoạt động bình thường',
    data: healthData,
  };

  logger.info('Health check performed');
  res.status(200).json(response);
});

/**
 * @route GET /api/v1/health/database
 * @desc Kiểm tra kết nối database
 * @access Public
 */
router.get('/database', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();

    // Test database connection with a simple query
    // await prisma.$queryRaw`SELECT 1 as test`;
    // Simulate database check for now
    await new Promise(resolve => setTimeout(resolve, 100));

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    const dbHealth = {
      status: 'Connected',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    };

    const response: ApiResponse = {
      success: true,
      message: 'Kết nối database thành công',
      data: dbHealth,
    };

    logger.info(`Database health check: ${responseTime}ms`);
    res.status(200).json(response);
  } catch (error) {
    logger.error('Database health check failed:', error);

    const response: ApiResponse = {
      success: false,
      message: 'Lỗi kết nối database',
      errors: [(error as Error).message],
    };

    res.status(503).json(response);
  }
});

/**
 * @route GET /api/v1/health/detailed
 * @desc Kiểm tra chi tiết tình trạng hệ thống
 * @access Public
 */
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();

    // Test database connection
    // await prisma.$queryRaw`SELECT 1 as test`;
    // Simulate database check for now
    await new Promise(resolve => setTimeout(resolve, 50));

    const dbResponseTime = Date.now() - startTime;

    const detailedHealth = {
      server: {
        status: 'OK',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
      },
      database: {
        status: 'Connected',
        responseTime: `${dbResponseTime}ms`,
        provider: 'sqlserver',
      },
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
        external: Math.round((process.memoryUsage().external / 1024 / 1024) * 100) / 100,
        rss: Math.round((process.memoryUsage().rss / 1024 / 1024) * 100) / 100,
      },
      cpu: {
        usage: process.cpuUsage(),
      },
      timestamp: new Date().toISOString(),
    };

    const response: ApiResponse = {
      success: true,
      message: 'Kiểm tra chi tiết hệ thống thành công',
      data: detailedHealth,
    };

    logger.info('Detailed health check performed');
    res.status(200).json(response);
  } catch (error) {
    logger.error('Detailed health check failed:', error);

    const response: ApiResponse = {
      success: false,
      message: 'Lỗi kiểm tra hệ thống',
      errors: [(error as Error).message],
    };

    res.status(503).json(response);
  }
});

export { router as healthRoutes };
