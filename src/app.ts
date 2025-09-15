console.log('🔥 File app.ts được load!');

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config/env';
import { logger } from './config/logger';
// import { globalErrorHandler, notFound } from './middleware/error';
// Sẽ lazy-require routes khi mount để tránh treo do vòng import/khởi tạo sớm

console.log('🔥 Imports commented!');
console.log('🔥 File app.ts được load!');

// Create Express application
const app = express();

// Trust proxy (for deployment behind reverse proxy)
app.set('trust proxy', 1);

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://cdn.jsdelivr.net',
          'https://cdnjs.cloudflare.com',
        ],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://cdn.jsdelivr.net',
          'https://cdnjs.cloudflare.com',
        ],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        fontSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
      },
    },
  })
);

// CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // In development, allow all origins for easier testing
    if (config.env === 'development') {
      return callback(null, true);
    }

    // In production, check configured origins
    const allowedOrigins = (config.cors.origin as string).split(',').map(o => o.trim());
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Không được phép truy cập bởi CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// // Rate limiting
// const limiter = rateLimit({
//   windowMs: config.rateLimit.windowMs,
//   max: config.rateLimit.maxRequests,
//   message: {
//     success: false,
//     message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau.',
//     errors: ['Rate limit exceeded'],
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// app.use(limiter);

// Compression middleware
app.use(compression());

// Body parsing middleware với UTF-8 support
app.use(
  express.json({
    limit: '10mb',
    type: ['application/json', 'text/plain'],
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  })
);

// Middleware để đảm bảo UTF-8 encoding cho request body
app.use((req, res, next) => {
  if (req.body) {
    // Đảm bảo tất cả string trong body được xử lý đúng UTF-8
    const processObject = (obj: any): any => {
      if (typeof obj === 'string') {
        // Đảm bảo string được decode đúng UTF-8
        try {
          return Buffer.from(obj, 'utf8').toString('utf8');
        } catch {
          return obj;
        }
      } else if (Array.isArray(obj)) {
        return obj.map(processObject);
      } else if (obj && typeof obj === 'object') {
        const processed: any = {};
        for (const key in obj) {
          processed[key] = processObject(obj[key]);
        }
        return processed;
      }
      return obj;
    };

    req.body = processObject(req.body);
  }
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
  });

  next();
});

// Health check endpoint (before API routes)
app.get('/ping', (req, res) => {
  res.json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString(),
  });
});

// API routes (lazy import)
app.use(`${config.api.prefix}/${config.api.version}`, (req, res, next) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const apiRoutes = require('./routes').default;
  return apiRoutes.handle ? apiRoutes.handle(req, res, next) : apiRoutes(req, res, next);
});

// Database Viewer routes
import databaseViewerRoutes from './routes/databaseViewerRoutes';
import fileNumRoutes from './routes/fileNumRoutes';
app.use('/database-viewer', databaseViewerRoutes);
app.use('/file-num', fileNumRoutes);

// API test page
app.get('/api-test', (_req, res) => {
  res.render('api-test', {
    title: 'API Test - Ngọc Minh Medical',
    apiBase: `${config.api.prefix}/${config.api.version}`,
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Ngọc Minh Medical Backend API',
    version: '1.0.0',
    description: 'Hệ thống backend quản lý dữ liệu hình ảnh y tế',
    documentation: {
      health: '/ping',
      api: `${config.api.prefix}/${config.api.version}`,
      swagger: '/docs',
    },
    environment: config.env,
    timestamp: new Date().toISOString(),
  });
});

// Handle 404 - Not Found
// app.use(notFound);

// Global error handling middleware (must be last)
// app.use(globalErrorHandler);

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Uncaught exception handler
process.on('uncaughtException', error => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

export default app;
console.log('✅ app.ts đã export app!');
