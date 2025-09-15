import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { AppError } from './error';
import { config } from '../config/env';

// Allowed file types for medical images
const allowedMimeTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/webp',
  'application/dicom', // DICOM medical images
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Loại file không được hỗ trợ: ${file.mimetype}. Chỉ chấp nhận: ${allowedMimeTypes.join(', ')}`,
        400,
        'INVALID_FILE_TYPE'
      )
    );
  }
};

// Storage configuration for medical images
const createStorage = (subfolder: string) => {
  return multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
      const uploadPath = path.join(config.upload.path, subfolder);

      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath);
    },
    filename: (req: Request, file: Express.Multer.File, cb) => {
      // Generate unique filename with timestamp
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const extension = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, extension);

      cb(null, `${baseName}-${uniqueSuffix}${extension}`);
    },
  });
};

// Storage that preserves original filename (for HA document uploads where filename encodes ItemNum)
const createOriginalNameStorage = (subfolder: string) => {
  return multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
      const uploadPath = path.join(config.upload.path, subfolder);
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req: Request, file: Express.Multer.File, cb) => {
      cb(null, file.originalname);
    },
  });
};

// Memory storage for direct database storage
const memoryStorage = multer.memoryStorage();

// Base multer configuration
const multerConfig = {
  limits: {
    fileSize: config.upload.maxFileSize, // 10MB by default
    files: 5, // Maximum 5 files per request
  },
  fileFilter,
};

// Upload configurations for different medical image types
export const uploadConfig = {
  // For X-ray, CT, MRI images
  imagingResults: multer({
    ...multerConfig,
    storage: createStorage('imaging-results'),
  }),

  // For pathology images
  pathologyImages: multer({
    ...multerConfig,
    storage: createStorage('pathology'),
  }),

  // For general medical graphics
  graphics: multer({
    ...multerConfig,
    storage: createStorage('graphics'),
  }),

  // For clinical files
  clinicalFiles: multer({
    ...multerConfig,
    storage: createStorage('clinical'),
  }),

  // For files that need to be stored directly in database
  memory: multer({
    ...multerConfig,
    storage: memoryStorage,
  }),

  // General medical documents
  documents: multer({
    ...multerConfig,
    storage: createStorage('documents'),
  }),

  // HA result documents (keep original file name to map to ItemNum)
  haDocs: multer({
    ...multerConfig,
    storage: createOriginalNameStorage('ha-docs'),
  }),
};

// Single file upload middleware
export const uploadSingle = (fieldName: string, type: keyof typeof uploadConfig = 'documents') => {
  return uploadConfig[type].single(fieldName);
};

// Multiple files upload middleware
export const uploadMultiple = (
  fieldName: string,
  maxCount: number = 5,
  type: keyof typeof uploadConfig = 'documents'
) => {
  return uploadConfig[type].array(fieldName, maxCount);
};

// Fields upload middleware (for mixed file types)
export const uploadFields = (
  fields: multer.Field[],
  type: keyof typeof uploadConfig = 'documents'
) => {
  return uploadConfig[type].fields(fields);
};

// File size formatter
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get file info helper
export const getFileInfo = (file: Express.Multer.File) => {
  return {
    originalName: file.originalname,
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    sizeFormatted: formatFileSize(file.size),
    path: file.path,
    destination: file.destination,
  };
};

// Clean up uploaded files (for error handling)
export const cleanupFiles = (files: Express.Multer.File[] | Express.Multer.File) => {
  const fileArray = Array.isArray(files) ? files : [files];

  fileArray.forEach(file => {
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  });
};

// Validate image dimensions (optional)
export const validateImageDimensions = (
  width: number,
  height: number,
  maxWidth: number = 4096,
  maxHeight: number = 4096
): boolean => {
  return width <= maxWidth && height <= maxHeight;
};

export default uploadConfig;
