import dotenv from 'dotenv';
import Joi from 'joi';
import path from 'path';

// Load environment variables
dotenv.config();

console.log('🔥 File env.ts được load!');

// Define validation schema for environment variables
const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

  PORT: Joi.number().positive().default(3000),

  DATABASE_URL: Joi.string().required().description('SQL Server connection string is required'),

  API_VERSION: Joi.string().default('v1'),

  API_PREFIX: Joi.string().default('/api'),

  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .description('JWT secret must be at least 32 characters'),

  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),

  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),

  LOG_FILE: Joi.string().default('logs/app.log'),

  MAX_FILE_SIZE: Joi.number().positive().default(10485760), // 10MB

  UPLOAD_PATH: Joi.string().default('uploads/'),

  RATE_LIMIT_WINDOW_MS: Joi.number().positive().default(900000), // 15 minutes

  RATE_LIMIT_MAX_REQUESTS: Joi.number().positive().default(100),

  // AWS S3 Configuration
  AWS_ACCESS_KEY_ID: Joi.string().required().description('AWS Access Key ID is required'),
  AWS_SECRET_ACCESS_KEY: Joi.string().required().description('AWS Secret Access Key is required'),
  AWS_REGION: Joi.string().default('ap-southeast-1'),
  AWS_S3_BUCKET: Joi.string().required().description('S3 Bucket name is required'),
}).unknown();

// Validate environment variables
const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`❌ Lỗi cấu hình môi trường: ${error.message}`);
}

// Export validated environment variables
export const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  databaseUrl: envVars.DATABASE_URL,
  api: {
    version: envVars.API_VERSION,
    prefix: envVars.API_PREFIX,
  },
  jwt: {
    secret: envVars.JWT_SECRET,
  },
  cors: {
    origin: envVars.CORS_ORIGIN,
  },
  logging: {
    level: envVars.LOG_LEVEL,
    file: envVars.LOG_FILE,
  },
  upload: {
    maxFileSize: envVars.MAX_FILE_SIZE,
    path: envVars.UPLOAD_PATH,
  },
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    maxRequests: envVars.RATE_LIMIT_MAX_REQUESTS,
  },
  aws: {
    accessKeyId: envVars.AWS_ACCESS_KEY_ID,
    secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
    region: envVars.AWS_REGION,
    s3Bucket: envVars.AWS_S3_BUCKET,
  },
};

// Create upload directory if it doesn't exist
import fs from 'fs';
const uploadDir = path.join(process.cwd(), config.upload.path);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export default config;
