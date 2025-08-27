import { Request, Response } from 'express';

// Common API Response Interface
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Extended Request Interface
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email?: string;
  };
}

// Query Parameters Interface
export interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filter?: Record<string, any>;
}

// File Upload Interface
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}

// Medical Image Types
export interface MedicalImageData {
  id?: number;
  patientId?: string;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  imageType?: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Imaging Result Types
export interface ImagingResultData {
  id?: number;
  resultId?: number;
  resultData?: Buffer;
  conclusionData?: Buffer;
  suggestionData?: Buffer;
  createdAt?: Date;
  updatedAt?: Date;
}

// PACS System Types
export interface PACSRequestInfo {
  id?: number;
  patientId?: string;
  studyId?: string;
  seriesId?: string;
  fileResultURL?: string;
  viewURL?: string;
  modality?: string;
  studyDate?: Date;
  description?: string;
  status?: number;
}

// Error Types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface DatabaseError extends Error {
  code?: string;
  meta?: any;
}

// Enum Types
export enum PathologyType {
  XRAY = 1,
  CT = 2,
  MRI = 3,
  ULTRASOUND = 4,
  MAMMOGRAPHY = 5,
  ENDOSCOPY = 6,
}

export enum FileType {
  IMAGE = 1,
  PDF = 2,
  DOCUMENT = 3,
  VIDEO = 4,
}

export enum Gender {
  MALE = 1,
  FEMALE = 2,
}

export enum RecordStatus {
  ACTIVE = 1,
  INACTIVE = 2,
  DELETED = 3,
}

// Service Response Types
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

// Export commonly used types
export type { Request, Response } from 'express';
